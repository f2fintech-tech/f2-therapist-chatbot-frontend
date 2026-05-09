import { logger } from "./logger";

interface MoodDimensions {
  stress: number;
  urgency: number;
  openness: number;
  willingness: number;
  emotion: number;
}

interface MoodAnalysis {
  primary_emotion: "calm" | "anxious" | "stressed";
  label: string;
  dimensions: MoodDimensions;
}

interface ChatAIResponse {
  message: string;
  mood: MoodAnalysis;
  suggestions: string[];
}

const SYSTEM_PROMPT = `You are FinHeal AI — a warm, empathetic financial wellness companion that combines the insight of a financial advisor with the compassion of a therapist. You speak like a trusted, brilliant friend who happens to understand money deeply.

Your core principles:
- Always acknowledge feelings FIRST before facts
- Use "I" and "you" language — feel personal, not clinical
- Break complex financial topics into human-sized pieces
- Offer hope and a clear next step in every response
- Never judge — every financial situation is understandable
- Use light markdown (bold for key terms) but keep it conversational
- Keep responses to 3-5 short paragraphs maximum
- End responses with a gentle, open-ended question

Tone: warm, clear, grounded, quietly confident. Like a friend who gets it.`;

const AI_REPLIES: Array<{
  keywords: string[];
  emotion: "calm" | "anxious" | "stressed";
  label: string;
  dims: MoodDimensions;
  text: string;
  suggestions: string[];
}> = [
  {
    keywords: ["emi", "loan", "debt", "interest", "paying"],
    emotion: "anxious",
    label: "Sensing Anxiety",
    dims: { stress: 65, urgency: 60, openness: 72, willingness: 78, emotion: 45 },
    text: "I completely understand that feeling — juggling multiple loans can feel like running on a treadmill that never stops. That anxiety is completely valid, and it's very common.\n\nHere's what I want you to know: **interest-heavy phases are normal in the early loan lifecycle.** But there are proven strategies to break out of that cycle without overwhelming yourself.\n\nTo give you a real, personalised plan — not just generic advice — could you tell me a bit more? Which loan has the highest interest rate, and roughly how many EMIs are left on it?",
    suggestions: ["Explain the avalanche method", "Show me a 6-month plan", "What is my total debt?"]
  },
  {
    keywords: ["credit", "cibil", "score", "dropped"],
    emotion: "stressed",
    label: "Sensing Stress",
    dims: { stress: 72, urgency: 68, openness: 58, willingness: 65, emotion: 55 },
    text: "A drop in credit score can feel like a punch to the gut — especially when you've been trying your best. Let's put this in perspective together.\n\n**Credit scores are not permanent.** They're a snapshot in time, and every single factor that lowers them can be reversed with consistent, simple actions.\n\nThe most powerful things you can do right now: pay minimums on time (even just minimums!), keep credit utilisation below 30%, and avoid new credit applications for 60 days. Would you like me to walk you through a 3-month score recovery plan?",
    suggestions: ["Yes, give me a 3-month plan", "What affects my score most?", "How long to recover?"]
  },
  {
    keywords: ["budget", "spend", "saving", "save", "expense"],
    emotion: "calm",
    label: "Collaborative Mode",
    dims: { stress: 40, urgency: 45, openness: 85, willingness: 88, emotion: 30 },
    text: "That's such a smart question to be asking — budgeting is genuinely one of the most powerful things you can do for your financial health, and the fact that you're thinking about it puts you ahead.\n\nThe simplest framework I love is **50/30/20**: 50% for needs, 30% for wants, 20% for savings and debt repayment. But the real secret is tracking for just 2 weeks — it shows you exactly where money quietly disappears.\n\nWould you like me to help you create a personalised budget based on your income and current commitments?",
    suggestions: ["Yes, help me create a budget", "What is the 50/30/20 rule?", "Track my expenses"]
  },
  {
    keywords: ["eligible", "loan", "apply", "borrow", "personal loan"],
    emotion: "calm",
    label: "Listening Carefully",
    dims: { stress: 35, urgency: 50, openness: 80, willingness: 82, emotion: 28 },
    text: "Loan eligibility is actually very calculable — there's no mystery to it, and I can help you understand exactly where you stand.\n\nLenders look at four main things: **income stability, credit score (ideally 700+), existing debt-to-income ratio (below 40% is ideal), and employment type**. Based on what you've shared, you're in a reasonable position.\n\nShall I walk you through each factor and tell you what you can do right now to maximise your eligibility before applying?",
    suggestions: ["Check my eligibility now", "How to improve my chances?", "What documents do I need?"]
  },
  {
    keywords: ["stressed", "anxious", "worried", "overwhelmed", "afraid", "scared"],
    emotion: "stressed",
    label: "Sensing Stress",
    dims: { stress: 78, urgency: 55, openness: 68, willingness: 72, emotion: 60 },
    text: "I hear you — and I want you to know that feeling overwhelmed about money is one of the most common human experiences. You are not alone in this, not even slightly.\n\nBefore we dive into numbers, take a breath. The fact that you're here, talking about this, means you're already ahead of most people who simply avoid it.\n\nLet's take this one step at a time. What feels most urgent right now — is it the immediate month-to-month pressure, or more of a longer-term worry about where things are heading?",
    suggestions: ["The immediate pressure", "The longer-term picture", "Both — help me prioritise"]
  },
];

const DEFAULT_RESPONSE: ChatAIResponse = {
  message: "Thank you for sharing that with me. 💙 It takes real courage to open up about financial stress, and I want you to know this is a safe space.\n\nEvery financial challenge has a path through it — and you've already taken the first step by talking about it. Let me help you see this clearly.\n\nCould you tell me a bit more about what's weighing on you most right now? The more I understand, the more specific and useful my support can be.",
  mood: {
    primary_emotion: "calm",
    label: "Listening Carefully",
    dimensions: { stress: 42, urgency: 38, openness: 80, willingness: 85, emotion: 32 }
  },
  suggestions: ["Tell me more about my situation", "Where should I start?", "What can I improve first?"]
};

export function generateAIResponse(message: string): ChatAIResponse {
  const lower = message.toLowerCase();

  for (const reply of AI_REPLIES) {
    if (reply.keywords.some(kw => lower.includes(kw))) {
      return {
        message: reply.text,
        mood: {
          primary_emotion: reply.emotion,
          label: reply.label,
          dimensions: reply.dims,
        },
        suggestions: reply.suggestions,
      };
    }
  }

  logger.debug({ message }, "No keyword match — returning default response");
  return DEFAULT_RESPONSE;
}
