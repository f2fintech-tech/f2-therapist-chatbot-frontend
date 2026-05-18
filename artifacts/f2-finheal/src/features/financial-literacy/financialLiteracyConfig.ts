export type FinancialLiteracyLevelId = 1 | 2 | 3;
export type FinancialLiteracyCategory =
  | "budgeting"
  | "saving"
  | "banking"
  | "debt"
  | "credit"
  | "insurance"
  | "investing"
  | "tax"
  | "planning"
  | "behavior";
export type AnswerLetter = "A" | "B" | "C" | "D";

export type FinancialLiteracyLevelMeta = {
  id: FinancialLiteracyLevelId;
  name: string;
  badge: string;
  difficulty: string;
  description: string;
  goal: string;
  skills: string[];
  estimatedMinutes: number;
  questionCount: number;
};

export type FinancialLiteracyQuestion = {
  id: string;
  level: FinancialLiteracyLevelId;
  category: FinancialLiteracyCategory;
  prompt: string;
  options: [string, string, string, string];
  correctAnswer: AnswerLetter;
};

export const financialLiteracyLevels: FinancialLiteracyLevelMeta[] = [
  {
    id: 1,
    name: "Beginner",
    badge: "Foundation",
    difficulty: "Easy to Moderate",
    description: "Build your foundation in personal finance and money management.",
    goal: "Check everyday financial understanding and healthy money habits.",
    skills: ["Budgeting", "Saving", "Bank accounts", "EMIs", "Credit awareness"],
    estimatedMinutes: 10,
    questionCount: 20,
  },
  {
    id: 2,
    name: "Intermediate",
    badge: "Decision Making",
    difficulty: "Moderate",
    description: "Test your ability to make informed financial decisions.",
    goal: "Measure practical decision-making across debt, savings, and investing.",
    skills: ["Credit scores", "Inflation", "SIPs", "Insurance", "Tax planning"],
    estimatedMinutes: 10,
    questionCount: 20,
  },
  {
    id: 3,
    name: "Advanced",
    badge: "Strategy",
    difficulty: "Moderate to Hard",
    description: "Evaluate strategic financial thinking and long-term wealth management.",
    goal: "Test portfolio, tax, and long-term planning judgment.",
    skills: ["Asset allocation", "Rebalancing", "Tax efficiency", "Retirement planning", "Behavior"],
    estimatedMinutes: 10,
    questionCount: 20,
  },
];

function q(
  id: string,
  level: FinancialLiteracyLevelId,
  category: FinancialLiteracyCategory,
  prompt: string,
  options: [string, string, string, string],
  correctAnswer: AnswerLetter,
): FinancialLiteracyQuestion {
  return { id, level, category, prompt, options, correctAnswer };
}

export const financialLiteracyQuestions: FinancialLiteracyQuestion[] = [
  q("b1", 1, "saving", "What is the primary purpose of an emergency fund?", ["To grow wealth quickly", "To cover unexpected expenses", "To pay taxes in advance", "To increase credit score"], "B"),
  q("b2", 1, "budgeting", "If your monthly salary is Rs. 50,000 and expenses are Rs. 40,000, how much can you ideally save?", ["Rs. 1,000", "Rs. 5,000", "Rs. 10,000", "Rs. 20,000"], "C"),
  q("b3", 1, "banking", "Which financial product is commonly used for salary deposits and daily transactions?", ["Fixed deposit", "Savings account", "Gold bond", "Mutual fund"], "B"),
  q("b4", 1, "credit", "What usually happens if you miss a credit card payment?", ["Your savings increase", "You may pay late fees and interest", "Your bank account is closed", "Your salary is taxed more"], "B"),
  q("b5", 1, "debt", "What does EMI stand for?", ["Easy Monthly Installment", "Equal Monthly Installment", "Expected Money Input", "Electronic Money Index"], "B"),
  q("b6", 1, "budgeting", "Which expense should generally be prioritized first?", ["Needs like rent and food", "Luxury shopping", "Impulse purchases", "Travel upgrades"], "A"),
  q("b7", 1, "saving", "What is usually considered a healthy saving habit?", ["Saving only when money is left over", "Setting aside part of income every month", "Borrowing to save more", "Investing without any buffer"], "B"),
  q("b8", 1, "budgeting", "If expenses are consistently higher than income, what does that indicate?", ["Budget surplus", "Cash flow deficit", "Credit expansion", "Tax efficiency"], "B"),
  q("b9", 1, "credit", "What is the safest purpose of using a credit card?", ["Buying only what you can repay fully", "Maxing out the limit", "Paying minimum due forever", "Borrowing cash for travel"], "A"),
  q("b10", 1, "budgeting", "Why is budgeting important?", ["It removes the need to earn money", "It helps track and control spending", "It guarantees investment returns", "It eliminates all risks"], "B"),
  q("b11", 1, "saving", "What does interest on savings mean?", ["A fee charged for withdrawals", "Extra money earned on deposits", "A penalty for saving too much", "A tax on cash balances"], "B"),
  q("b12", 1, "planning", "What is a financial goal?", ["A planned money target to achieve", "Any unplanned purchase", "A bank charge", "A loan statement"], "A"),
  q("b13", 1, "debt", "Why should you avoid impulsive borrowing?", ["It makes budgeting unnecessary", "It can create repayment stress", "It improves savings automatically", "It always lowers interest"], "B"),
  q("b14", 1, "credit", "What is the main benefit of paying bills on time?", ["Lower entertainment costs", "Better repayment discipline and fewer charges", "Higher shopping limits", "Lower inflation"], "B"),
  q("b15", 1, "behavior", "Which situation best reflects responsible money management?", ["Buying everything on impulse", "Saving before spending on extras", "Ignoring due dates", "Using credit for routine spending"], "B"),
  q("b16", 1, "insurance", "What is the purpose of insurance?", ["To guarantee profits", "To transfer certain financial risks", "To increase debt", "To replace saving completely"], "B"),
  q("b17", 1, "budgeting", "Why should people track monthly expenses?", ["To avoid learning about money", "To understand where cash is going", "To increase loan costs", "To reduce salary"], "B"),
  q("b18", 1, "behavior", "What does overspending usually lead to?", ["More free cash", "Lower savings or more debt", "Guaranteed wealth", "Lower bank balances only"], "B"),
  q("b19", 1, "banking", "What is the purpose of maintaining a bank account?", ["Only to store cards", "To safely hold and move money", "To avoid all expenses", "To replace budgeting"], "B"),
  q("b20", 1, "debt", "Why should someone compare loan options before borrowing?", ["To pick the highest fee", "To choose the most suitable cost and terms", "To avoid repayment", "To use the longest tenure only"], "B"),

  q("i1", 2, "budgeting", "How does inflation affect purchasing power over time?", ["It increases purchasing power", "It reduces how much money can buy", "It has no effect on prices", "It removes all expenses"], "B"),
  q("i2", 2, "credit", "Why is maintaining a good credit score important?", ["It guarantees loan approval", "It can improve access to better borrowing terms", "It replaces emergency savings", "It removes repayment obligations"], "B"),
  q("i3", 2, "debt", "What is the key difference between secured and unsecured loans?", ["Secured loans need collateral", "Unsecured loans always have lower interest", "Secured loans are never repaid", "Unsecured loans require property"], "A"),
  q("i4", 2, "investing", "What is the primary purpose of diversification in investing?", ["To increase risk in one asset", "To reduce dependence on a single outcome", "To guarantee profits", "To remove all market risk"], "B"),
  q("i5", 2, "investing", "How does compounding help long-term investing?", ["It reduces the need for discipline", "Returns can earn their own returns", "It eliminates volatility", "It only helps short-term traders"], "B"),
  q("i6", 2, "investing", "Which investment option generally carries higher risk but potentially higher returns?", ["Bank savings account", "Equity shares", "Fixed deposit", "Cash at home"], "B"),
  q("i7", 2, "insurance", "Why is health insurance financially important?", ["It removes all medical risk", "It can protect savings from large medical bills", "It increases tax only", "It guarantees better health"], "B"),
  q("i8", 2, "investing", "What is a SIP in mutual funds?", ["Single Income Plan", "Systematic Investment Plan", "Savings Interest Program", "Secure Investment Portfolio"], "B"),
  q("i9", 2, "credit", "What happens when credit utilization stays consistently high?", ["It can signal elevated credit risk", "It always improves credit score", "It removes interest charges", "It lowers debt automatically"], "A"),
  q("i10", 2, "debt", "Which factor should be prioritized while choosing a loan?", ["The lowest monthly EMI only", "Total cost, rate, and tenure", "The longest name", "The highest processing fee"], "B"),
  q("i11", 2, "debt", "How can increasing EMI amounts reduce total interest paid?", ["By repaying principal faster", "By lowering income taxes", "By increasing loan tenure", "By skipping payments"], "A"),
  q("i12", 2, "credit", "What is the biggest risk of paying only minimum due on credit cards?", ["Faster principal reduction", "Interest keeps compounding on the balance", "The card becomes free", "Tax refunds increase"], "B"),
  q("i13", 2, "investing", "Why is asset allocation important?", ["It decides how money is split across asset types", "It removes all risk", "It only matters after retirement", "It is the same as saving"], "A"),
  q("i14", 2, "tax", "What is tax planning?", ["Ignoring tax rules", "Planning finances to manage taxes efficiently", "Avoiding all investments", "Paying more tax than needed"], "B"),
  q("i15", 2, "investing", "How does delaying investments affect wealth creation?", ["It can reduce compounding time", "It always improves returns", "It guarantees higher income", "It has no effect"], "A"),
  q("i16", 2, "planning", "What does risk tolerance mean?", ["How much uncertainty you can accept", "How much tax you pay", "How much debt you have", "How fast interest grows"], "A"),
  q("i17", 2, "planning", "Why should someone review financial goals periodically?", ["Goals and income can change over time", "It prevents all spending", "It guarantees returns", "It removes the need to budget"], "A"),
  q("i18", 2, "debt", "How can multiple loans impact financial flexibility?", ["They can reduce room for new goals", "They always improve cash flow", "They remove the need for savings", "They lower interest automatically"], "A"),
  q("i19", 2, "saving", "What is the benefit of maintaining liquidity?", ["Money is available for short-term needs", "It replaces long-term goals", "It eliminates market risk", "It guarantees investment gains"], "A"),
  q("i20", 2, "planning", "Why is retirement planning important even at a younger age?", ["Compounding needs time to work", "Retirement happens instantly", "You should avoid saving", "It only matters after age 60"], "A"),

  q("a1", 3, "investing", "How does diversification reduce portfolio risk?", ["By putting everything into one winner", "By spreading exposure across assets", "By removing all return potential", "By increasing leverage"], "B"),
  q("a2", 3, "investing", "Why might high returns not always indicate a better investment?", ["Because risk may be much higher", "Because taxes disappear", "Because all returns are guaranteed", "Because diversification becomes unnecessary"], "A"),
  q("a3", 3, "planning", "How does inflation impact long-term retirement planning?", ["It can raise future spending needs", "It has no effect over time", "It lowers all expenses", "It removes the need for savings"], "A"),
  q("a4", 3, "investing", "What is the relationship between risk and expected return?", ["They are always unrelated", "Higher risk often comes with higher expected return", "Risk always means loss", "Return is never linked to risk"], "B"),
  q("a5", 3, "debt", "How can debt restructuring improve financial stability?", ["By reducing repayment strain or interest", "By eliminating income tax", "By increasing multiple penalties", "By removing savings goals"], "A"),
  q("a6", 3, "investing", "Why is balancing liquidity and investment growth important?", ["You need cash access and long-term growth", "Growth always replaces liquidity", "Liquidity always beats investing", "They cannot coexist"], "A"),
  q("a7", 3, "investing", "What is the advantage of starting long-term investing early?", ["You get more compounding time", "You can ignore risk completely", "You avoid all taxes", "You never need diversification"], "A"),
  q("a8", 3, "planning", "How does asset allocation vary with age and financial goals?", ["It should match goals, horizon, and risk capacity", "It should always be 100% cash", "It never changes", "It only matters for rich investors"], "A"),
  q("a9", 3, "behavior", "Why is behavioral discipline important in investing?", ["It helps avoid emotional mistakes", "It guarantees maximum returns", "It removes market cycles", "It makes taxes vanish"], "A"),
  q("a10", 3, "debt", "What is the potential downside of excessive leverage?", ["Higher exposure to repayment stress", "Lower risk in all cases", "Automatic wealth growth", "No impact on cash flow"], "A"),
  q("a11", 3, "investing", "How can economic downturns affect different asset classes differently?", ["Some assets may fall more than others", "All assets move exactly the same", "No asset ever changes", "Only savings accounts are affected"], "A"),
  q("a12", 3, "investing", "What is the importance of maintaining portfolio rebalancing?", ["It keeps allocation aligned with goals", "It guarantees profits", "It removes taxes", "It prevents all volatility"], "A"),
  q("a13", 3, "tax", "Why is tax-efficient investing important?", ["It can improve after-tax returns", "It removes all taxes", "It avoids diversification", "It eliminates risk entirely"], "A"),
  q("a14", 3, "investing", "How can inflation-adjusted returns differ from nominal returns?", ["Real returns account for inflation", "Nominal returns are always higher", "Inflation has no effect", "They are always identical"], "A"),
  q("a15", 3, "investing", "What role does diversification play during market volatility?", ["It can reduce portfolio swings", "It increases concentration risk", "It guarantees positive returns", "It removes the need for planning"], "A"),
  q("a16", 3, "behavior", "How can emotional decision-making impact investment outcomes?", ["It can lead to poor timing decisions", "It always improves returns", "It removes risk", "It lowers inflation"], "A"),
  q("a17", 3, "planning", "What is the purpose of long-term wealth allocation planning?", ["To align assets with life goals", "To spend everything quickly", "To avoid all cash reserves", "To maximize debt"], "A"),
  q("a18", 3, "investing", "How can concentrated investments increase financial risk?", ["They depend heavily on one outcome", "They always reduce losses", "They remove volatility", "They guarantee diversification"], "A"),
  q("a19", 3, "planning", "What is sequence of returns risk in retirement planning?", ["Poor early returns can hurt withdrawals", "Returns are always the same", "Inflation disappears in retirement", "Taxes are zero after retirement"], "A"),
  q("a20", 3, "planning", "Why should financial strategies evolve with life stages?", ["Goals, risks, and time horizons change", "Money rules never change", "Investments should stop after 30", "Leverage should always increase"], "A"),
];

export const financialLiteracyQuestionsByLevel: Record<FinancialLiteracyLevelId, FinancialLiteracyQuestion[]> = {
  1: financialLiteracyQuestions.filter((question) => question.level === 1),
  2: financialLiteracyQuestions.filter((question) => question.level === 2),
  3: financialLiteracyQuestions.filter((question) => question.level === 3),
};

export const financialLiteracyCategoryLabels: Record<FinancialLiteracyCategory, string> = {
  budgeting: "Budgeting",
  saving: "Saving",
  banking: "Banking",
  debt: "Debt",
  credit: "Credit",
  insurance: "Insurance",
  investing: "Investing",
  tax: "Tax",
  planning: "Planning",
  behavior: "Behavior",
};

export const financialLiteracyLevelIds: FinancialLiteracyLevelId[] = [1, 2, 3];
export const financialLiteracyStorageVersion = 3;
export const financialLiteracyLevelDurationMinutes = 10;
