import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditFaqPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Safe defaults in case route state is missing
    const initial = location.state || {};
    const [faqId, setFaqId] = useState(initial.faqId || "");
    const [question, setQuestion] = useState(initial.question || "");
    const [answer, setAnswer] = useState(initial.answer || "");
    const [submitting, setSubmitting] = useState(false);

    async function updateFaq(e) {
        e?.preventDefault?.();
        if (submitting) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }

        if (!faqId.trim() || !question.trim() || !answer.trim()) {
            toast.error("Please fill all required fields");
            return;
        }

        const body = { faqId: faqId.trim(), question: question.trim(), answer: answer.trim() };

        try {
            setSubmitting(true);
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/faqs/${faqId}`, body, {
                headers: { Authorization: "Bearer " + token },
            });
            toast.success("FAQ updated successfully");
            navigate("/admin/faqs");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to update FAQ");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 font-[var(--font-main)]">
            {/* Page header */}
            <div className="mx-auto max-w-3xl mb-4 text-center">
                <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-800">
                    Edit FAQ
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Update the question and answer content, then save your changes.
                </p>
            </div>

            {/* Card */}
            <form
                onSubmit={updateFaq}
                className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="p-4 md:p-6 space-y-5">
                    {/* Row 1: ID (disabled) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="FAQ ID *"
                            value={faqId}
                            onChange={setFaqId}
                            placeholder="FAQ-001"
                            disabled
                        />
                        <div className="flex flex-col justify-end">
                            <p className="text-xs text-slate-500">
                                The ID is fixed and cannot be changed.
                            </p>
                        </div>
                    </div>

                    {/* Question */}
                    <Field
                        label="Question *"
                        placeholder="How do I track my order?"
                        value={question}
                        onChange={setQuestion}
                    />

                    {/* Answer */}
                    <TextareaField
                        label="Answer *"
                        placeholder="You can track your order by visiting the Orders page and entering your Order ID..."
                        value={answer}
                        onChange={setAnswer}
                        rows={6}
                    />
                </div>

                {/* Footer actions */}
                <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4 md:px-6 md:py-5 rounded-b-2xl flex items-center justify-end gap-3">
                    <Link
                        to="/admin/faqs"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[.99]"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[.99] disabled:opacity-60"
                    >
                        {submitting ? (
                            <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></span>
                Saving...
              </span>
                        ) : (
                            "Update FAQ"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}



function Field({ label, value, onChange, placeholder, type = "text", disabled = false }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <input
                type={type}
                value={value}
                required
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                    disabled ? "opacity-75 cursor-not-allowed bg-slate-50" : ""
                }`}
            />
        </div>
    );
}

function TextareaField({ label, value, onChange, placeholder, rows = 5 }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <textarea
                rows={rows}
                value={value}
                required
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="mt-1 text-[11px] text-slate-400">
                Tip: Keep answers short and scannable. Use simple language.
            </div>
        </div>
    );
}
