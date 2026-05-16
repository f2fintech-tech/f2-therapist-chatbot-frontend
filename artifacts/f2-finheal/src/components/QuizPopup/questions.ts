export interface QuizQuestion {
  scenario: string;
  options: string[];
  correctAnswerIndex: number;
  category: string;
  emoji: string;
  microTip: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    scenario: "Your monthly EMI is fixed, but you just got a pay bump. What do you do to reduce the total interest paid?",
    options: [
      "Keep paying the same EMI and save the extra amount separately.",
      "Ask the lender to extend the loan tenure so the EMI drops.",
      "Use the additional income to make an extra payment toward the principal.",
      "Skip one EMI this month and pay it later when cash is freer."
    ],
    correctAnswerIndex: 2,
    category: "EMI basics",
    emoji: "💸",
    microTip: "Paying extra principal lowers the total interest faster than stretching the loan over a longer tenure."
  },
  {
    scenario: "You have a credit card bill due in three days. You also have a small emergency fund. Which move keeps your finances healthiest?",
    options: [
      "Pay the full statement balance from your emergency fund.",
      "Pay only the minimum and keep the fund intact.",
      "Transfer the balance to another card with a slightly lower rate.",
      "Buy a small cash-based replacement item instead."
    ],
    correctAnswerIndex: 0,
    category: "Credit health",
    emoji: "🪪",
    microTip: "Paying the full bill on time protects your credit score and keeps interest charges from compounding."
  },
  {
    scenario: "A new gadget is tempting, but you also want a safer cash buffer. What habit helps you build financial resilience?",
    options: [
      "Buy the gadget on EMI and keep saving a little each month.",
      "Put the purchase on your card and pay it off over three months.",
      "Delay the purchase until you’ve saved three months of expenses.",
      "Borrow from a friend so you don’t drain your savings."
    ],
    correctAnswerIndex: 2,
    category: "Savings discipline",
    emoji: "🛡️",
    microTip: "A strong emergency buffer is more reliable than a new purchase when life hits an unexpected expense."
  },
  {
    scenario: "Your portfolio is mostly fixed deposits with a small equity portion. For a 5-year growth goal, what is the best next step?",
    options: [
      "Keep the same mix and wait for market returns.",
      "Move everything into equity for higher returns.",
      "Add a balanced fund that mixes equity and debt.",
      "Hold the cash until the goal is one year away."
    ],
    correctAnswerIndex: 2,
    category: "Investment readiness",
    emoji: "📈",
    microTip: "A balanced fund is often a better fit for medium-term growth than staying too conservative or too aggressive."
  },
  {
    scenario: "A lender offers a lower EMI by extending your loan by four years. What should you focus on first?",
    options: [
      "The lower monthly payment feels easier, so accept it.",
      "The total cost of the loan over the full period.",
      "Whether the lender will approve the new term quickly.",
      "How the lower EMI affects your next month’s budget."
    ],
    correctAnswerIndex: 1,
    category: "Credit awareness",
    emoji: "🏦",
    microTip: "A lower EMI can look good in the short term, but the total interest paid usually matters more over time."
  }
];
