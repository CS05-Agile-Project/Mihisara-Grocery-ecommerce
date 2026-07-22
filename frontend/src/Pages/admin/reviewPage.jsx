/* eslint-disable */
import { useEffect, useMemo, useState } from "react";
import {
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiCalendar,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-emerald-700">
      <div className="animate-spin h-12 w-12 border-4 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
      <p className="text-lg font-semibold">Loading Reviews...</p>
    </div>
  );
}

export default function AdminReviewPage() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [q, setQ] = useState("");
  const [minRating, setMinRating] = useState("all");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Reply modal state
  const [replyingReview, setReplyingReview] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (!isLoading) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      setIsLoading(false);
      return;
    }
    axios
      .get(import.meta.env.VITE_BACKEND_URL+"/api/reviews", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        setReviews(Array.isArray(res.data) ? res.data : []);
        setIsLoading(false);
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Failed to load reviews");
        setReviews([]);
        setIsLoading(false);
      });
  }, [isLoading]);

  const kpis = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((a, r) => a + Number(r.rating || 0), 0);
    const avg = total ? (sum / total).toFixed(1) : "0.0";
    const fiveStar = reviews.filter((r) => Number(r.rating) === 5).length;
    return { total, avg, fiveStar };
  }, [reviews]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const min = minRating === "all" ? 0 : Number(minRating);
    return reviews.filter((r) => {
      const matchesText =
        !term ||
        String(r.reviewId || "").toLowerCase().includes(term) ||
        String(r.usersName || "").toLowerCase().includes(term) ||
        String(r.email || "").toLowerCase().includes(term) ||
        String(r.comment || "").toLowerCase().includes(term);
      const ratingNum = Number(r.rating || 0);
      return matchesText && ratingNum >= min;
    });
  }, [reviews, q, minRating]);

  const clearFilters = () => {
    setQ("");
    setMinRating("all");
  };

  const ratingData = useMemo(() => {
    return [1, 2, 3, 4, 5].map((r) => ({
      rating: `${r}`,
      count: reviews.filter((rev) => Number(rev.rating) === r).length,
    }));
  }, [reviews]);

  const keywordFreq = useMemo(() => {
    const stop = new Set([
      "the",
      "and",
      "a",
      "is",
      "to",
      "for",
      "of",
      "in",
      "on",
      "it",
      "this",
      "that",
      "with",
      "at",
      "as",
      "was",
      "but",
      "be",
      "are",
      "we",
      "our",
      "your",
      "you",
    ]);
    const map = {};
    reviews.forEach((r) => {
      (r.comment || "")
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .forEach((w) => {
          if (w && !stop.has(w)) map[w] = (map[w] || 0) + 1;
        });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [reviews]);

  const handleCreateReport = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select From and To dates");
      return;
    }
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    const logo = new Image();
    logo.src = "/logo123.png";
    await new Promise((res) => (logo.onload = res));
    doc.addImage(logo, "PNG", 15, 10, 25, 15);
    doc.setFontSize(14);
    doc.text("Mihisara Grocery Review Analysis Report", pageWidth / 2, 30, {
      align: "center",
    });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 15, 20, {
      align: "right",
    });
    doc.setTextColor(0, 128, 0);
    doc.text(
      `Report Period: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`,
      pageWidth / 2,
      37,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);

    const chartEl = document.getElementById("ratingChart");
    if (chartEl) {
      const canvas = await html2canvas(chartEl, { backgroundColor: "#fff" });
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 20, 40, pageWidth - 40, 80);
    }

    autoTable(doc, {
      startY: 130,
      head: [["Keyword", "Frequency"]],
      body: keywordFreq.map(([w, c]) => [w, c]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 10, halign: "center" },
      columnStyles: { 0: { halign: "left" } },
    });

    doc.setFontSize(9);
    doc.text("Report generated by: System Administrator", 15, 285);
    doc.text("Mihisara Grocery Review Analysis System", 15, 290);
    doc.text("Page 1 / 1", pageWidth - 20, 290);
    doc.save("Review_Analysis_Report.pdf");
  };

  // Send reply with message
  const sendReplyEmail = async () => {
    if (!replyingReview || !replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }
    try {
      await axios.post(import.meta.env.VITE_BACKEND_URL+"/api/reviews/reply", {
        email: replyingReview.email,
        usersName: replyingReview.usersName,
        rating: replyingReview.rating,
        message: replyMessage,
      });
      toast.success("Reply email sent successfully!");
      setReplyingReview(null);
      setReplyMessage("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="w-full h-full max-h-full overflow-y-auto p-4 md:p-6 font-[var(--font-main)]">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-dgreen">
          Reviews Management
        </h1>
        <p className="text-sm text-slate-500">
          View, filter, and generate analysis reports
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Reviews" value={kpis.total} />
        <KpiCard title="Average Rating" value={`${kpis.avg} / 5`} />
        <KpiCard title="5 Reviews" value={kpis.fiveStar} />
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <FiFilter />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <div className="relative md:w-72">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, ID or comment"
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">Minimum 5</option>
              <option value="4">Minimum 4</option>
              <option value="3">Minimum 3</option>
              <option value="2">Minimum 2</option>
              <option value="1">Minimum 1</option>
            </select>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <FiRefreshCw className="text-slate-500" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Date range + create report */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6 flex flex-wrap items-center gap-3 justify-center md:justify-end">
        <div className="flex items-center gap-2 text-emerald-600">
          <FiCalendar className="text-lg" />
          <span className="text-sm text-slate-700 font-medium">From:</span>
          <DatePicker
            selected={fromDate}
            onChange={(d) => setFromDate(d)}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            className="border rounded px-3 py-1 text-sm"
          />
          <span className="text-sm text-slate-700 font-medium">To:</span>
          <DatePicker
            selected={toDate}
            onChange={(d) => setToDate(d)}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            className="border rounded px-3 py-1 text-sm"
          />
        </div>
        <button
          onClick={handleCreateReport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm"
        >
          Create report
        </button>
      </div>

      {/* Hidden chart for PDF */}
      <div className="absolute -left-[9999px]">
        <div id="ratingChart" style={{ width: 600, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Review table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Review ID</Th>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Rating</Th>
                <Th>Comment</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, index) => (
                <tr
                  key={r.reviewId || r._id || index}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <Td className="max-w-[220px] truncate text-emerald-700 font-medium">
                    {r.reviewId}
                  </Td>
                  <Td>{r.usersName || "-"}</Td>
                  <Td className="truncate max-w-[260px]">{r.email || "-"}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <RatingStars value={Number(r.rating) || 0} />
                      <span className="text-xs text-slate-500">
                        {(Number(r.rating) || 0).toFixed(1)}
                      </span>
                    </div>
                  </Td>
                  <Td className="max-w-[420px]">
                    <span className="block truncate">{r.comment || "-"}</span>
                  </Td>
                  <Td className="text-center">
                    <button
                      onClick={() => setReplyingReview(r)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      Reply
                    </button>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    className="py-10 px-4 text-center text-slate-500 italic"
                    colSpan={6}
                  >
                    No reviews match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">
              Reply to {replyingReview.usersName}
            </h2>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply message..."
              rows={5}
              className="w-full border rounded-lg p-2 mb-4 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReplyingReview(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={sendReplyEmail}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// UI helpers
function KpiCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

function RatingStars({ value = 0, outOf = 5 }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5 && full < outOf;
  const empty = outOf - full - (hasHalf ? 1 : 0);
  const Star = ({ type }) => (
    <span
      className={
        type === "full"
          ? "text-amber-500"
          : type === "half"
          ? "text-amber-500"
          : "text-slate-300"
      }
    >
      {type === "half" ? "" : ""}
    </span>
  );
  return (
    <span className="leading-none text-sm">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} type="full" />
      ))}
      {hasHalf && <Star type="half" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} type="empty" />
      ))}
    </span>
  );
}
function Th({ children, className = "" }) {
  return (
    <th
      className={`py-3 px-4 text-xs font-semibold uppercase ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`py-3 px-4 text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}

