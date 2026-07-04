import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddFaqPage() {

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    async function addFaq(e) {
        e?.preventDefault?.();
        if (submitting) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }

        if ( !question.trim() || !answer.trim()) {
            toast.error("Please fill all required fields");
            return;
        }

        const body = {
            question: question.trim(),
            answer: answer.trim(),
        };

        try {
            setSubmitting(true);
            await axios.post(import.meta.env.VITE_BACKEND_URL+"/api/faqs", body, {
                headers: { Authorization: "Bearer " + token },
            });
            toast.success("FAQ added successfully");
            navigate("/admin/faqs");
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to add FAQ");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 font-[var(--font-main)]">
            {/* Page header */}
            <div className="mx-auto max-w-3xl mb-4 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-dgreen">
                    Add New FAQ
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Create a frequently asked question with a clear, concise answer.
                </p>
            </div>

            {/* Card */}
            <form
                onSubmit={addFaq}
                className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="p-4 md:p-6 space-y-5">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="flex flex-col justify-end">
                            <p className="text-xs text-slate-500">
                                identifier is auto-generating
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
                        className="inline-flex items-center justify-center rounded-lg bg-dgreen px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-dgreen/80 active:scale-[.99] disabled:opacity-60"
                    >
                        {submitting ? (
                            <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></span>
                Saving...
              </span>
                        ) : (
                            "Add FAQ"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}



function Field({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <input
                type={type}
                value={value}
                required
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
