import { GoogleGenAI } from "@google/genai";
import Faq from "../models/faq.js";

const MAX_MESSAGE_LENGTH = 1000;
const INTERACTION_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function buildSystemInstruction(faqs) {
  const faqContext =
    faqs.length > 0
      ? faqs
          .map(
            (faq, index) =>
              `${index + 1}. Question: ${faq.question}\nAnswer: ${faq.answer}`
          )
          .join("\n\n")
      : "No store FAQs are currently available.";

  return `You are Mihisara Assistant, the friendly customer-support chatbot for Mihisara Grocery, an online grocery store in Hikkaduwa, Sri Lanka.

Rules:
- Help with shopping, delivery, payments, returns, accounts, and how to use the Mihisara Grocery website.
- Treat the store FAQ content below as the source of truth.
- Never invent prices, stock availability, order status, policies, discounts, or delivery times.
- If information is not present, say you are not certain and direct the customer to Contact Us or +94 71 755 7972 (8:00 a.m. to 8:00 p.m. daily).
- Never claim that you placed, changed, cancelled, or refunded an order.
- Do not request passwords, card details, OTPs, or other sensitive information.
- Keep answers warm, clear, and concise. Reply in the language used by the customer when possible.

Store FAQs:
${faqContext}`;
}

export async function sendChatMessage(req, res) {
  const message =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const previousInteractionId =
    typeof req.body?.previousInteractionId === "string"
      ? req.body.previousInteractionId.trim()
      : "";

  if (!message) {
    return res.status(400).json({ message: "Please enter a message." });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      message: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    });
  }

  if (
    previousInteractionId &&
    !INTERACTION_ID_PATTERN.test(previousInteractionId)
  ) {
    return res.status(400).json({ message: "Invalid conversation ID." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      message: "The AI assistant has not been configured yet.",
    });
  }

  try {
    const faqs = await Faq.find({}, { question: 1, answer: 1, _id: 0 })
      .sort({ faqId: 1 })
      .limit(50)
      .lean();

    const request = {
      model: process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite",
      input: message,
      system_instruction: buildSystemInstruction(faqs),
      generation_config: {
        temperature: 0.3,
        max_output_tokens: 300,
        thinking_level: "minimal",
      },
    };

    if (previousInteractionId) {
      request.previous_interaction_id = previousInteractionId;
    }

    const interaction = await ai.interactions.create(request);
    const reply = interaction.output_text?.trim();

    if (!reply) {
      return res.status(502).json({
        message: "The assistant could not create a response. Please try again.",
      });
    }

    return res.json({
      reply,
      interactionId: interaction.id,
    });
  } catch (error) {
    console.error("Gemini chat request failed:", error?.message || error);

    const status = error?.status || error?.code;
    if (status === 429) {
      return res.status(429).json({
        message: "The assistant is busy right now. Please try again shortly.",
      });
    }

    if (status === 401 || status === 403) {
      return res.status(503).json({
        message: "The AI assistant configuration needs attention.",
      });
    }

    return res.status(502).json({
      message: "The AI assistant is temporarily unavailable. Please try again.",
    });
  }
}
