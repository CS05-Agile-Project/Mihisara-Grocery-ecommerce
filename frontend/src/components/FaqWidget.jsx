import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CircleHelp,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi! I’m Mihisara Assistant. How can I help with your shopping today?",
};

export default function FaqWidget() {
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState("");
  const [interactionId, setInteractionId] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}/api/faqs`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load FAQs");
        return res.json();
      })
      .then((data) => setFaqs(data.faqs || []))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setFaqError("Could not load FAQs right now.");
        }
      })
      .finally(() => setFaqLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setActiveTab("faqs");
      setOpen(true);
    };

    window.addEventListener("open-faq", handleOpen);
    return () => window.removeEventListener("open-faq", handleOpen);
  }, []);

  useEffect(() => {
    if (open && activeTab === "chat") {
      window.setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInteractionId("");
    setInput("");
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = input.trim();

    if (!message || sending) return;

    setMessages((current) => [...current, { role: "user", text: message }]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          previousInteractionId: interactionId || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "The assistant is unavailable.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply },
      ]);
      setInteractionId(data.interactionId || "");
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "error",
          text:
            error.message ||
            "I couldn’t send that message. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200"
        aria-label={open ? "Close support panel" : "Open AI support assistant"}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 ring-2 ring-white">
            <Sparkles className="h-3 w-3 text-amber-900" />
          </span>
        )}
      </button>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close support panel"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 md:rounded-l-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Mihisara customer support"
      >
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-5 pb-4 pt-5 text-white md:rounded-tl-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-semibold">Mihisara Support</h2>
                <p className="flex items-center gap-1.5 text-xs text-emerald-50">
                  <span className="h-2 w-2 rounded-full bg-lime-300" />
                  AI assistant
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 transition hover:bg-white/15"
              aria-label="Close support panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-200 bg-white px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
              activeTab === "chat"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Bot className="h-4 w-4" />
            AI Assistant
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("faqs")}
            className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
              activeTab === "faqs"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <CircleHelp className="h-4 w-4" />
            FAQs
          </button>
        </div>

        {activeTab === "chat" ? (
          <>
            <div
              className="flex-1 space-y-4 overflow-y-auto bg-emerald-50/40 p-4"
              aria-live="polite"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-md bg-emerald-600 text-white"
                        : message.role === "error"
                          ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700"
                          : "rounded-bl-md border border-gray-100 bg-white text-gray-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                    <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600" />
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 bg-white p-4">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={resetChat}
                  disabled={sending}
                  className="mb-2 flex items-center gap-1 text-xs text-gray-500 transition hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  New conversation
                </button>
              )}
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <label className="sr-only" htmlFor="chat-message">
                  Type your message
                </label>
                <textarea
                  ref={inputRef}
                  id="chat-message"
                  rows="1"
                  maxLength="1000"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Ask about orders, delivery, returns…"
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
              <p className="mt-2 text-center text-[11px] text-gray-400">
                AI can make mistakes. Don’t share passwords, OTPs, or card details.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="mb-1 font-semibold text-gray-900">
              Frequently Asked Questions
            </h3>
            <p className="mb-5 text-sm text-gray-500">
              Quick answers from Mihisara Grocery.
            </p>

            {faqLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600" />
                Loading FAQs…
              </div>
            ) : faqError ? (
              <p className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
                {faqError}
              </p>
            ) : faqs.length === 0 ? (
              <p className="mt-6 text-center text-sm text-gray-500">
                No FAQs available yet.
              </p>
            ) : (
              faqs.map((faq) => (
                <details
                  key={faq.faqId}
                  className="group mb-3 rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <summary className="cursor-pointer rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 group-open:rounded-b-none group-open:bg-emerald-50 group-open:text-emerald-700">
                    {faq.question}
                  </summary>
                  <p className="border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-600">
                    {faq.answer}
                  </p>
                </details>
              ))
            )}
          </div>
        )}
      </aside>
    </>
  );
}
