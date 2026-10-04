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
  },
  {
    "id": "q4",
    "question": "Which of the following is a liability?",
    "options": [
      "Cash",
      "Furniture",
      "Creditors",
      "Stock"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q5",
    "question": "Which financial statement shows the profit or loss of a business?",
    "options": [
      "Balance Sheet",
      "Trial Balance",
      "Income Statement",
      "Cash Book"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q6",
    "question": "Which account is debited when goods are purchased for cash?",
    "options": [
      "Cash Account",
      "Purchases Account",
      "Sales Account",
      "Capital Account"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q7",
    "question": "Goods sold for cash are recorded by debiting:",
    "options": [
      "Sales Account",
      "Purchases Account",
      "Cash Account",
      "Customer Account"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q8",
    "question": "When furniture is purchased for cash, which account is debited?",
    "options": [
      "Cash Account",
      "Furniture Account",
      "Purchases Account",
      "Sales Account"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q9",
    "question": "Salary paid in cash is recorded by debiting:",
    "options": [
      "Cash Account",
      "Salary Account",
      "Capital Account",
      "Outstanding Salary Account"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q10",
    "question": "When cash is introduced into the business by the owner, which account is credited?",
    "options": [
      "Cash Account",
      "Drawings Account",
      "Capital Account",
      "Sales Account"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q11",
    "question": "Which of the following is an Asset Account?",
    "options": [
      "Capital",
      "Sales",
      "Machinery",
      "Salary"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q12",
    "question": "Which of the following is a Liability Account?",
    "options": [
      "Debtors",
      "Creditors",
      "Purchases",
      "Drawings"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q13",
    "question": "Which of the following is an Income Account?",
    "options": [
      "Rent Received",
      "Furniture",
      "Creditors",
      "Cash"
    ],
    "correctAnswer": 0,
    "marks": 1
  },
  {
    "id": "q14",
    "question": "Which of the following is an Expense Account?",
    "options": [
      "Sales",
      "Capital",
      "Wages",
      "Debtors"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q15",
    "question": "Under the modern approach, Capital is classified as:",
    "options": [
      "Asset",
      "Liability",
      "Income",
      "Expense"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q16",
    "question": "Which equation represents the basic accounting equation?",
    "options": [
      "Assets = Capital − Liabilities",
      "Assets = Liabilities + Capital",
      "Capital = Assets + Liabilities",
      "Liabilities = Assets + Capital"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q17",
    "question": "If Assets are ₹80,000 and Liabilities are ₹30,000, the Capital will be:",
    "options": [
      "₹50,000",
      "₹1,10,000",
      "₹30,000",
      "₹80,000"
    ],
    "correctAnswer": 0,
    "marks": 1
  },
  {
    "id": "q18",
    "question": "What is the main purpose of preparing a Trial Balance?",
    "options": [
      "To calculate cash balance",
      "To check the arithmetical accuracy of ledger accounts",
      "To calculate sales",
      "To prepare invoices"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q19",
    "question": "In a Trial Balance, the total of debit balances should normally be:",
    "options": [
      "Greater than credit balances",
      "Less than credit balances",
      "Equal to credit balances",
      "Nil"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q20",
    "question": "Which of the following normally has a debit balance?",
    "options": [
      "Capital",
      "Sales",
      "Purchases",
      "Creditors"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q21",
    "question": "Which account is prepared to determine Gross Profit or Gross Loss?",
    "options": [
      "Profit and Loss Account",
      "Trading Account",
      "Balance Sheet",
      "Cash Account"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q22",
    "question": "Which of the following is shown on the debit side of the Trading Account?",
    "options": [
      "Sales",
      "Purchases",
      "Capital",
      "Creditors"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q23",
    "question": "Which account is prepared to determine Net Profit or Net Loss?",
    "options": [
      "Trading Account",
      "Profit and Loss Account",
      "Balance Sheet",
      "Trial Balance"
    ],
    "correctAnswer": 1,
    "marks": 1
  },
  {
    "id": "q24",
    "question": "Closing stock is shown in the Balance Sheet as:",
    "options": [
      "Liability",
      "Expense",
      "Asset",
      "Income"
    ],
    "correctAnswer": 2,
    "marks": 1
  },
  {
    "id": "q25",
    "question": "Which of the following is generally shown on the liabilities side of the Balance Sheet of a sole trader?",
    "options": [
      "Cash",
      "Furniture",
      "Debtors",
      "Capital"
    ],
    "correctAnswer": 3,
    "marks": 1
  }
];
