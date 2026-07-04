import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FiFilter, FiRefreshCw, FiSearch, FiPlus } from "react-icons/fi";

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-emerald-700">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg font-semibold">Loading Faqs...</p>
        </div>
    );
}

export default function AdminFaqPage() {
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    // filters
    const [q, setQ] = useState(""); // search across id/question/answer
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            setIsLoading(false);
            return;
        }
        axios
            .get(import.meta.env.VITE_BACKEND_URL+"/api/faqs", {
                headers: { Authorization: "Bearer " + token },
            })
            .then((res) => {
                // API returns { faqs: [...] }
                setFaqs(Array.isArray(res.data.faqs) ? res.data.faqs : []);
                setFetchError("");
            })
            .catch((e) => {
                const msg = e.response?.data?.message || "Failed to load FAQs";
                setFetchError(msg);
                toast.error(msg);
                setFaqs([]);
            })
            .finally(() => setIsLoading(false));
    }, [isLoading]);

    function deleteFaq(faqId) {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }
        axios
            .delete(`${import.meta.env.VITE_BACKEND_URL}/api/faqs/${faqId}`, {
                headers: { Authorization: "Bearer " + token },
            })
            .then(() => {
                toast.success("FAQ deleted successfully");
                setIsLoading(true);
            })
            .catch((e) => {
                toast.error(e.response?.data?.message || "Failed to delete FAQ");
            });
    }

    // KPI
    const kpis = useMemo(() => {
        const total = faqs.length;
        const unanswered = faqs.filter((f) => !f.answer || !String(f.answer).trim()).length;
        return { total, unanswered };
    }, [faqs]);

    // filtered list
    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return faqs;
        return faqs.filter((f) => {
            return (
                String(f.faqId || "").toLowerCase().includes(term) ||
                String(f.question || "").toLowerCase().includes(term) ||
                String(f.answer || "").toLowerCase().includes(term)
            );
        });
    }, [faqs, q]);

    const clearFilters = () => setQ("");


    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingScreen />
            </div>
        );
    }

    return (
        <div className="w-full h-full max-h-full overflow-y-auto p-4 md:p-6 font-[var(--font-main)]">
            {/* Header + primary action */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-dgreen">
                        FAQ Management
                    </h1>
                    <p className="text-sm text-slate-500">
                        Create, edit and organize frequently asked questions
                    </p>
                </div>

                <Link
                    to="/admin/add-faqs"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-dgreen px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                    <FiPlus className="text-base" />
                    Add FAQ
                </Link>
            </div>

            {/* KPI cards */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-1 gap-4">
                <KpiCard title="Total FAQs" value={kpis.total} />

            </div>

            {/* Filter toolbar */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                        <FiFilter />
                        <span className="text-sm font-medium">Filters</span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                        <div className="relative md:w-96">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by question, answer or ID"
                                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                            />
                        </div>

                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 active:scale-[.98]"
                        >
                            <FiRefreshCw className="text-slate-500" />
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="w-full h-[40vh] flex justify-center items-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-[var(--color-accent)] rounded-full animate-spin"></div>
                </div>
            ) : fetchError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    {fetchError}
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <Th>FAQ ID</Th>
                                <Th className="w-1/3">Question</Th>
                                <Th className="w-1/2">Answer</Th>
                                <Th className="text-center">Actions</Th>
                            </tr>
                            </thead>

                            <tbody>
                            {filtered.map((f, index) => {
                                const key = f.faqId || f._id || index;
                                const unanswered = !f.answer || !String(f.answer).trim();

                                return (
                                    <tr
                                        key={key}
                                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                    >
                                        <Td className="font-medium text-emerald-700 truncate max-w-[220px]">
                                            {f.faqId}
                                        </Td>

                                        {/* Question */}
                                        <Td>
                                            <div className="text-slate-800">{f.question || "-"}</div>
                                        </Td>

                                        {/* Answer (clamped w/ tooltip) */}
                                        <Td className="align-top">
                                            <div
                                                className="line-clamp-2 text-slate-700"
                                                title={String(f.answer || "-")}
                                            >
                                                {f.answer || (
                                                    <span className="italic text-slate-400">No answer yet</span>
                                                )}
                                            </div>
                                        </Td>

                                        {/* Actions */}
                                        <Td className="text-center">
                                            <div className="inline-flex items-center gap-3">
                                                <button
                                                    onClick={() => navigate("/admin/edit-faqs", { state: f })}
                                                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition"
                                                    title="Edit"
                                                >
                                                    <FaEdit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteFaq(f.faqId)}
                                                    className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition"
                                                    title="Delete"
                                                >
                                                    <FaTrash size={18} />
                                                </button>
                                            </div>

                                            {/* Unanswered badge */}
                                            {unanswered && (
                                                <div className="mt-2">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                              Needs answer
                            </span>
                                                </div>
                                            )}
                                        </Td>
                                    </tr>
                                );
                            })}

                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-10 px-4 text-center text-slate-500 italic"
                                    >
                                        No FAQs match your filters.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------------- Tiny UI atoms ---------------- */

function KpiCard({ title, value }) {
    return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-3">
            <div className="text-xs text-slate-500">{title}</div>
            <div className="mt-1 text-xl font-bold text-slate-800">{value}</div>
        </div>
    );
}

function Th({ children, className = "" }) {
    return (
        <th className={`py-3 px-4 text-xs font-semibold uppercase ${className}`}>
            {children}
        </th>
    );
}

function Td({ children, className = "" }) {
    return (
        <td className={`py-3 px-4 text-sm text-slate-700 ${className}`}>{children}</td>
    );
}
