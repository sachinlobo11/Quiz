export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
};

// REPLACE THIS ARRAY LATER WITH YOUR REAL QUESTIONS.
// correctAnswer is zero-based: 0=A, 1=B, 2=C, 3=D.
export const questions: QuizQuestion[] =
  [
    {
      "id": "q1",
      "question": "Which of the following is an asset?",
      "options": [
        "Capital",
        "Cash",
        "Sales",
        "Purchases"
      ],
      "correctAnswer": 1,
      "marks": 1
    },
    {
      "id": "q2",
      "question": "What is the basic accounting equation?",
      "options": [
        "Assets = Liabilities − Capital",
        "Assets = Capital + Liabilities",
        "Capital = Assets + Liabilities",
        "Liabilities = Assets + Capital"
      ],
      "correctAnswer": 1,
      "marks": 1
    },
    {
      "id": "q3",
      "question": "Which account is debited when cash is received from a customer?",
      "options": [
        "Cash Account",
        "Sales Account",
        "Customer Account",
        "Capital Account"
      ],
      "correctAnswer": 0,
      "marks": 1
    }
  ];
