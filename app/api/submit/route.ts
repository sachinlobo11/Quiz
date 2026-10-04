import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface SubmissionPayload {
  attemptId: string;
  studentName: string;
  registerNumber: string;
  totalQuestions: number;
  attempted: number;
  skipped: number;
  correct: number;
  wrong: number;
  score: number;
  percentage: number;
  timeTaken: string;
  tabSwitches: number;
  submissionType: "manual" | "auto";
}

export async function POST(request: NextRequest) {
  try {
    const googleAppsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

    // Check if the Apps Script URL is configured in environment variables
    if (!googleAppsScriptUrl || !googleAppsScriptUrl.trim()) {
      console.error("Missing GOOGLE_APPS_SCRIPT_URL environment variable.");
      return NextResponse.json(
        { success: false, message: "Unable to submit quiz" },
        { status: 500 }
      );
    }

    // Safely parse incoming JSON body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      console.error("Invalid JSON body received in /api/submit.");
      return NextResponse.json(
        { success: false, message: "Unable to submit quiz" },
        { status: 400 }
      );
    }

    if (!rawBody || typeof rawBody !== "object") {
      console.error("Payload is missing or not a JSON object.");
      return NextResponse.json(
        { success: false, message: "Unable to submit quiz" },
        { status: 400 }
      );
    }

    const body = rawBody as Record<string, unknown>;

    // Validate required string fields
    const attemptId = typeof body.attemptId === "string" ? body.attemptId.trim() : "";
    const studentName = typeof body.studentName === "string" ? body.studentName.trim() : "";
    const registerNumber = typeof body.registerNumber === "string" ? body.registerNumber.trim() : "";
    const timeTaken = typeof body.timeTaken === "string" ? body.timeTaken.trim() : "";
    const rawSubmissionType = typeof body.submissionType === "string" ? body.submissionType.trim() : "";

    if (!attemptId || !studentName || !registerNumber || !timeTaken) {
      console.error("Missing required string fields in submission payload.");
      return NextResponse.json(
        { success: false, message: "Unable to submit quiz" },
        { status: 400 }
      );
    }

    const submissionType: "manual" | "auto" = rawSubmissionType === "auto" ? "auto" : "manual";

    // Validate and convert numeric values
    const totalQuestions = Number(body.totalQuestions);
    const attempted = Number(body.attempted);
    const skipped = Number(body.skipped);
    const correct = Number(body.correct);
    const wrong = Number(body.wrong);
    const score = Number(body.score);
    const percentage = Number(body.percentage);
    const tabSwitches = Number(body.tabSwitches);

    const numericValues = [
      { name: "totalQuestions", value: totalQuestions },
      { name: "attempted", value: attempted },
      { name: "skipped", value: skipped },
      { name: "correct", value: correct },
      { name: "wrong", value: wrong },
      { name: "score", value: score },
      { name: "percentage", value: percentage },
      { name: "tabSwitches", value: tabSwitches },
    ];

    for (const field of numericValues) {
      if (!Number.isFinite(field.value) || field.value < 0) {
        console.error(`Invalid numeric field ${field.name}:`, field.value);
        return NextResponse.json(
          { success: false, message: "Unable to submit quiz" },
          { status: 400 }
        );
      }
    }

    // Build clean submission payload
    const submissionData: SubmissionPayload = {
      attemptId,
      studentName,
      registerNumber,
      totalQuestions: Math.floor(totalQuestions),
      attempted: Math.floor(attempted),
      skipped: Math.floor(skipped),
      correct: Math.floor(correct),
      wrong: Math.floor(wrong),
      score: Math.floor(score),
      percentage: Number(percentage.toFixed(2)),
      timeTaken,
      tabSwitches: Math.floor(tabSwitches),
      submissionType,
    };

    // Forward data to Google Apps Script Web App
    let gasResponse: Response;
    try {
      gasResponse = await fetch(googleAppsScriptUrl.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
        redirect: "follow",
      });
    } catch (networkError) {
      console.error("Network failure communicating with Google Apps Script:", networkError);
      return NextResponse.json(
        { success: false, message: "Unable to submit quiz" },
        { status: 502 }
      );
    }

    if (!gasResponse.ok) {
      console.error(
        "Google Apps Script returned HTTP error status:",
        gasResponse.status,
        gasResponse.statusText
      );
      return NextResponse.json(
        { success: false, message: "Unable to submit quiz" },
        { status: 502 }
      );
    }

    const gasText = await gasResponse.text();
    let result: { success?: boolean; duplicate?: boolean; message?: string };
    try {
      result = JSON.parse(gasText);
    } catch (parseError) {
      console.error("Failed to parse Google Apps Script response JSON:", gasText, parseError);
      return NextResponse.json(
        { success: false, message: "Unable to submit quiz" },
        { status: 502 }
      );
    }

    // Handle duplicate submission response
    if (result.duplicate) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: result.message || "This quiz attempt has already been submitted.",
      });
    }

    // Handle successful submission response
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || "Quiz submitted successfully",
      });
    }

    // Handle unsuccessful response from Google Apps Script
    console.error("Google Apps Script reported an error:", result.message);
    return NextResponse.json(
      { success: false, message: "Unable to submit quiz" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Unexpected error in /api/submit route:", error);
    return NextResponse.json(
      { success: false, message: "Unable to submit quiz" },
      { status: 500 }
    );
  }
}
