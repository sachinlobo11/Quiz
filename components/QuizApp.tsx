"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUIZ_DURATION_MINUTES, QUIZ_TITLE } from "@/lib/config";

type Question = {
  id: string;
  question: string;
  options: string[];
  marks: number;
  correctAnswer?: number;
};

type Answers = Record<string, number | null>;

type Result = {
  attemptId: string;
  totalQuestions: number;
  attempted: number;
  skipped: number;
  correct: number;
  wrong: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeTaken: string;
  tabSwitches: number;
  submissionType: "manual" | "auto";
};

type SavedAttempt = {
  attemptId: string;
  name: string;
  registerNumber: string;
  questionOrder: string[];
  answers: Answers;
  currentIndex: number;
  startedAt: string;
  endsAt: number;
  tabSwitches: number;
  submitted: boolean;
  submissionType?: "manual" | "auto";
  result?: Result;
};

const STORAGE_KEY = "mcq-quiz-attempt-v1";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback below
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or permission errors
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

export default function QuizApp() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saved, setSaved] = useState<SavedAttempt | null>(null);
  const [stage, setStage] = useState<"loading" | "login" | "quiz" | "result">("loading");
  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [order, setOrder] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [startedAt, setStartedAt] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_MINUTES * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [tabWarning, setTabWarning] = useState(false);
  const [error, setError] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // References to keep callbacks fresh without trigger loops
  const submittingRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const questionsRef = useRef<Question[]>([]);
  const orderRef = useRef<string[]>([]);
  const answersRef = useRef<Answers>({});
  const savedRef = useRef<SavedAttempt | null>(null);
  const nameRef = useRef("");
  const regRef = useRef("");
  const tabSwitchesRef = useRef(0);
  const startedAtRef = useRef("");
  const currentIndexRef = useRef(0);

  // Synchronize refs with state
  questionsRef.current = questions;
  orderRef.current = order;
  answersRef.current = answers;
  savedRef.current = saved;
  nameRef.current = name;
  regRef.current = registerNumber;
  tabSwitchesRef.current = tabSwitches;
  startedAtRef.current = startedAt;
  currentIndexRef.current = currentIndex;

  const persist = useCallback((patch: Partial<SavedAttempt>) => {
    const base: SavedAttempt = {
      attemptId: savedRef.current?.attemptId || generateUUID(),
      name: savedRef.current?.name || nameRef.current,
      registerNumber: savedRef.current?.registerNumber || regRef.current,
      questionOrder: savedRef.current?.questionOrder || orderRef.current,
      answers: savedRef.current?.answers || answersRef.current,
      currentIndex: savedRef.current?.currentIndex ?? currentIndexRef.current,
      startedAt: savedRef.current?.startedAt || startedAtRef.current,
      endsAt: savedRef.current?.endsAt || 0,
      tabSwitches: savedRef.current?.tabSwitches ?? tabSwitchesRef.current,
      submitted: savedRef.current?.submitted ?? false,
    };
    const updated = { ...base, ...patch };
    safeSetItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const loadQuestions = useCallback(() => {
    setStage("loading");
    setError("");
    fetch("/api/questions")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Server returned error (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data.questions || !data.questions.length) {
          throw new Error("No questions available.");
        }
        setQuestions(data.questions || []);

        const raw = safeGetItem(STORAGE_KEY);
        if (raw) {
          try {
            const attempt = JSON.parse(raw) as SavedAttempt;
            // If already submitted, preserve status and show submitted screen
            if (attempt.submitted) {
              setSaved(attempt);
              setName(attempt.name);
              setRegisterNumber(attempt.registerNumber);
              if (attempt.result) {
                setResult(attempt.result);
              }
              setAlreadySubmitted(true);
              setSubmissionMessage("This quiz attempt has already been submitted.");
              hasSubmittedRef.current = true;
              setStage("result");
              return;
            }

            // If an unsubmitted quiz attempt exists in localStorage, restore it
            if (attempt.questionOrder?.length && attempt.endsAt) {
              setSaved(attempt);
              setName(attempt.name);
              setRegisterNumber(attempt.registerNumber);
              setOrder(attempt.questionOrder);
              setAnswers(attempt.answers || {});
              setCurrentIndex(attempt.currentIndex || 0);
              setStartedAt(attempt.startedAt);
              setEndsAt(Number(attempt.endsAt));
              setTabSwitches(attempt.tabSwitches || 0);
              setStage("quiz");
              return;
            }
          } catch {
            safeRemoveItem(STORAGE_KEY);
          }
        }
        setStage("login");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load the quiz. Please refresh and try again.");
      });
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Submit function supporting both manual and auto submissions
  const submitQuiz = useCallback(async (isAuto = false) => {
    if (submittingRef.current || hasSubmittedRef.current) return;
    submittingRef.current = true;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setError("");

    const currentQuestions = questionsRef.current;
    const currentOrder = orderRef.current;
    const currentAnswers = answersRef.current;
    const currentSaved = savedRef.current;
    const currentSwitches = tabSwitchesRef.current;

    const totalQuestions = currentQuestions.length;
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let score = 0;
    let maxScore = 0;

    for (const q of currentQuestions) {
      maxScore += (q.marks || 1);
      const ans = currentAnswers[q.id];
      if (ans !== null && ans !== undefined) {
        attempted++;
        if (typeof q.correctAnswer === "number" && ans === q.correctAnswer) {
          correct++;
          score += (q.marks || 1);
        } else {
          wrong++;
        }
      }
    }

    const skipped = totalQuestions - attempted;
    const percentage = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;

    const start = currentSaved?.startedAt ? new Date(currentSaved.startedAt).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - start) / 1000));
    const timeTaken = formatDuration(elapsedSeconds);

    const attemptId = currentSaved?.attemptId || generateUUID();
    const studentName = (currentSaved?.name || nameRef.current).trim();
    const regNumber = (currentSaved?.registerNumber || regRef.current).trim();
    const submissionType: "manual" | "auto" = isAuto ? "auto" : "manual";

    const payload = {
      attemptId,
      studentName,
      registerNumber: regNumber,
      totalQuestions,
      attempted,
      skipped,
      correct,
      wrong,
      score,
      percentage,
      timeTaken,
      tabSwitches: currentSwitches,
      submissionType,
    };

    const calculatedResult: Result = {
      attemptId,
      totalQuestions,
      attempted,
      skipped,
      correct,
      wrong,
      score,
      maxScore,
      percentage,
      timeTaken,
      tabSwitches: currentSwitches,
      submissionType,
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit quiz");
      }

      // Persist submitted state and result into localStorage
      const finalAttempt: SavedAttempt = {
        attemptId,
        name: studentName,
        registerNumber: regNumber,
        questionOrder: currentOrder,
        answers: currentAnswers,
        currentIndex: currentIndexRef.current,
        startedAt: currentSaved?.startedAt || startedAtRef.current || new Date().toISOString(),
        endsAt: currentSaved?.endsAt || 0,
        tabSwitches: currentSwitches,
        submitted: true,
        submissionType,
        result: calculatedResult,
      };

      safeSetItem(STORAGE_KEY, JSON.stringify(finalAttempt));
      setSaved(finalAttempt);
      setResult(calculatedResult);
      setSubmissionMessage(
        data.duplicate
          ? "This quiz attempt has already been submitted."
          : isAuto
            ? "Time has expired. Your quiz was submitted automatically."
            : "Quiz submitted successfully!"
      );
      setStage("result");
    } catch (err) {
      // Allow retry if there was a network or server communication failure
      submittingRef.current = false;
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Unable to submit quiz. Please try again.");
    }
  }, []);

  // Timer effect with auto-submission when reaching 00:00
  useEffect(() => {
    if (stage !== "quiz" || !endsAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !submittingRef.current && !hasSubmittedRef.current) {
        submitQuiz(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt, stage, submitQuiz]);

  // Tab switch detection and warning
  useEffect(() => {
    if (stage !== "quiz") return;
    const onVisibility = () => {
      if (document.hidden) {
        setTabSwitches((count) => {
          const next = count + 1;
          tabSwitchesRef.current = next;
          persist({ tabSwitches: next });
          return next;
        });
      } else {
        setTabWarning(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [persist, stage]);

  const currentQuestion = useMemo(() => {
    const id = order[currentIndex];
    return questions.find((q) => q.id === id);
  }, [currentIndex, order, questions]);

  const answeredCount = order.filter((id) => answers[id] !== null && answers[id] !== undefined).length;
  const skippedCount = order.filter((id) => answers[id] === null).length;
  const unansweredCount = order.length - answeredCount - skippedCount;

  function startQuiz() {
    if (!name.trim() || !registerNumber.trim()) {
      setError("Please enter both your name and register/roll number.");
      return;
    }
    const shuffled = shuffle(questions.map((q) => q.id));
    const start = new Date();
    const end = Date.now() + QUIZ_DURATION_MINUTES * 60 * 1000;
    const attempt: SavedAttempt = {
      attemptId: generateUUID(),
      name: name.trim(),
      registerNumber: registerNumber.trim(),
      questionOrder: shuffled,
      answers: {},
      currentIndex: 0,
      startedAt: start.toISOString(),
      endsAt: end,
      tabSwitches: 0,
      submitted: false,
    };

    safeSetItem(STORAGE_KEY, JSON.stringify(attempt));
    setSaved(attempt);
    setOrder(shuffled);
    setAnswers({});
    setCurrentIndex(0);
    setStartedAt(attempt.startedAt);
    setEndsAt(end);
    setTabSwitches(0);
    setTimeLeft(QUIZ_DURATION_MINUTES * 60);
    setError("");
    setStage("quiz");
  }

  function selectAnswer(optionIndex: number) {
    if (!currentQuestion || isSubmitting || submittingRef.current || hasSubmittedRef.current) return;
    const next = { ...answers, [currentQuestion.id]: optionIndex };
    setAnswers(next);
    answersRef.current = next;
    persist({ answers: next, currentIndex });
  }

  function skipQuestion() {
    if (!currentQuestion || isSubmitting || submittingRef.current || hasSubmittedRef.current) return;
    const next = { ...answers, [currentQuestion.id]: null };
    setAnswers(next);
    answersRef.current = next;
    persist({ answers: next, currentIndex });
    if (currentIndex < order.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      persist({ currentIndex: nextIndex });
    }
  }

  function goTo(index: number) {
    if (isSubmitting || submittingRef.current || hasSubmittedRef.current) return;
    setCurrentIndex(index);
    currentIndexRef.current = index;
    persist({ currentIndex: index });
  }

  if (stage === "loading") {
    return (
      <main className="center page-pad">
        <div className="card" style={{ padding: "36px", textAlign: "center", minWidth: "300px", maxWidth: "420px" }}>
          {error ? (
            <>
              <div className="error" style={{ marginBottom: "16px" }}>{error}</div>
              <button className="primary wide" onClick={loadQuestions}>Retry</button>
            </>
          ) : (
            <>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: 0 }}>Loading quiz...</p>
            </>
          )}
        </div>
      </main>
    );
  }

  if (stage === "login") {
    return (
      <main className="center page-pad">
        <section className="card start-card">
          <div className="eyebrow">ONLINE ASSESSMENT</div>
          <h1>{QUIZ_TITLE}</h1>
          <p className="muted">You will have {QUIZ_DURATION_MINUTES} minutes to complete {questions.length} multiple-choice questions.</p>
          <div className="instructions">
            <strong>Instructions</strong>
            <ul>
              <li>You may move backward and forward and change your answers.</li>
              <li>You may skip questions and return to them later.</li>
              <li>Changing tabs/windows is recorded and a warning is displayed.</li>
              <li>Refreshing the page preserves your current attempt and timer.</li>
              <li>The quiz is submitted automatically when the timer reaches zero.</li>
              <li>Once submitted, your attempt is final and cannot be resubmitted.</li>
            </ul>
          </div>
          <label>
            Student Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </label>
          <label>
            Register / Roll Number
            <input
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              placeholder="Enter register or roll number"
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary wide" onClick={startQuiz}>Start Quiz</button>
        </section>
      </main>
    );
  }

  if (stage === "result" && (result || saved?.result)) {
    const displayResult = result || saved?.result!;
    const isAutoSubmission = displayResult.submissionType === "auto";

    return (
      <main className="center page-pad">
        <section className="card result-card">
          <div className="success-icon">✓</div>
          <div className="eyebrow">
            {alreadySubmitted ? "ALREADY SUBMITTED" : "SUBMISSION CONFIRMATION"}
          </div>
          <h1>{alreadySubmitted ? "Quiz Already Submitted" : "Quiz Submitted"}</h1>

          {/* User Confirmation Banner */}
          <div
            className="notice"
            style={{
              background: "#e8f7ef",
              color: "#17834b",
              borderColor: "#9ad5b7",
              fontWeight: 600,
              fontSize: "14px",
              lineHeight: 1.5,
              margin: "16px 0 20px"
            }}
          >
            {submissionMessage || (alreadySubmitted ? "This quiz attempt has already been submitted." : "Quiz submitted successfully")}
          </div>

          <p className="student-line">
            <strong>{name || saved?.name}</strong> · {registerNumber || saved?.registerNumber}
          </p>

          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 16px", wordBreak: "break-all" }}>
            Attempt ID: <code>{displayResult.attemptId}</code>
          </p>

          <div className="score-box">
            <span>Score</span>
            <strong>{displayResult.score} / {displayResult.maxScore}</strong>
            <small>{displayResult.percentage}%</small>
          </div>

          <div className="result-grid">
            <Stat label="Total Questions" value={displayResult.totalQuestions} />
            <Stat label="Attempted" value={displayResult.attempted} />
            <Stat label="Skipped" value={displayResult.skipped} />
            <Stat label="Correct" value={displayResult.correct} />
            <Stat label="Wrong" value={displayResult.wrong} />
            <Stat label="Time Taken" value={displayResult.timeTaken} />
            <Stat label="Tab Switches" value={displayResult.tabSwitches} />
            <Stat
              label="Submission Mode"
              value={isAutoSubmission ? "Auto (Timer)" : "Manual (Student)"}
            />
          </div>

          <p className="muted center-text" style={{ marginTop: "24px", fontSize: "13px" }}>
            Your submission has been securely recorded in  database. This attempt is complete and cannot be retaken.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="quiz-page">
      {tabWarning && (
        <div className="warning-banner">
          ⚠ Tab/window switch detected. This activity has been recorded.{" "}
          <button onClick={() => setTabWarning(false)}>Dismiss</button>
        </div>
      )}

      <header className="topbar">
        <div>
          <div className="brand">{QUIZ_TITLE}</div>
          <div className="student">{name} · {registerNumber}</div>
          <span>Sonal Steevan Lobo</span>
        </div>
        <div className={`timer ${timeLeft <= 60 ? "danger" : ""}`}>
          <span>TIME REMAINING</span>
          <strong>{formatTime(timeLeft)}</strong>
        </div>
      </header>

      <div className="content-grid">
        <section className="question-area">
          <div className="progress-row">
            <span>Question <strong>{currentIndex + 1}</strong> of {order.length}</span>
            <span>Answered {answeredCount}/{order.length}</span>
          </div>

          {currentQuestion && (
            <div className="question-card">
              <div className="question-number">QUESTION {currentIndex + 1}</div>
              <h2>{currentQuestion.question}</h2>
              <div className="options">
                {currentQuestion.options.map((option, index) => {
                  const selected = answers[currentQuestion.id] === index;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isSubmitting}
                      className={`option ${selected ? "selected" : ""}`}
                      onClick={() => selectAnswer(index)}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                      <span>{option}</span>
                      {selected && <span className="check">✓</span>}
                    </button>
                  );
                })}
              </div>

              <div className="nav-row">
                <button
                  type="button"
                  className="secondary"
                  disabled={currentIndex === 0 || isSubmitting}
                  onClick={() => goTo(currentIndex - 1)}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="skip"
                  disabled={isSubmitting}
                  onClick={skipQuestion}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={currentIndex === order.length - 1 || isSubmitting}
                  onClick={() => goTo(currentIndex + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="navigator card">
          <div className="navigator-head">
            <h3>Questions</h3>
            <span>{unansweredCount} left</span>
          </div>

          <div className="legend">
            <span><i className="dot answered" />Answered</span>
            <span><i className="dot unanswered" />Unanswered</span>
            <span><i className="dot skipped" />Skipped</span>
          </div>

          <div className="question-grid">
            {order.map((id, index) => {
              const status =
                answers[id] !== undefined && answers[id] !== null
                  ? "answered"
                  : answers[id] === null
                    ? "skipped"
                    : "unanswered";
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isSubmitting}
                  className={`${status} ${index === currentIndex ? "current" : ""}`}
                  onClick={() => goTo(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="review-summary">
            <div>
              <span>Answered</span>
              <strong>{answeredCount}</strong>
            </div>
            <div>
              <span>Skipped</span>
              <strong>{skippedCount}</strong>
            </div>
            <div>
              <span>Unanswered</span>
              <strong>{unansweredCount}</strong>
            </div>
          </div>

          {error && <div className="error" style={{ fontSize: "13px", marginTop: "12px" }}>{error}</div>}

          {/* SUBMIT BUTTON WITH DOUBLE-CLICK PREVENTION AND LOADING STATE */}
          <button
            type="button"
            id="quiz-submit-btn"
            className="submit"
            disabled={isSubmitting}
            onClick={() => submitQuiz(false)}
            style={{
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid #ffffff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }}
                />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </button>
        </aside>
      </div>

      <footer className="footer">
        <span>Tab switches recorded: <strong>{tabSwitches}</strong></span>
        <span>Attempt can be submitted only once</span>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
