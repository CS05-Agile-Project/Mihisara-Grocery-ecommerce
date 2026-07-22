import { useEffect, useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line, PieChart, Pie, Cell,
} from "recharts";
import { FiCalendar, FiDownload } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function dateToParam(date) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const OrderReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    useEffect(() => {
        let alive = true;
        const params = new URLSearchParams();
        if (fromDate) params.set("from", dateToParam(fromDate));
        if (toDate) params.set("to", dateToParam(toDate));
        const query = params.toString();

        (async () => {
            try {
                setLoading(true);
                const r = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/dashboard/overview${query ? `?${query}` : ""}`,
                    {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                    },
                    credentials: "include",
                    }
                );
                if (!r.ok) throw new Error(await r.text());
                const j = await r.json();
                if (alive) {
                    setData(j);
                    setLoading(false);
                }
            } catch (e) {
                setErr(e.message || "Failed to load dashboard");
                setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [fromDate, toDate]);

    const COLORS = useMemo(
        () => [
            "#6366F1",
            "#F59E0B",
            "#10B981",
            "#EF4444",
            "#3B82F6",
            "#A855F7",
            "#14B8A6",
            "#84CC16",
            "#F97316",
            "#64748B",
        ],
        []
    );

    const downloadPDF = async () => {
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Logo
        const logo = new Image();
        logo.src = "/logo123.png";
        await new Promise((resolve) => (logo.onload = resolve));
        doc.addImage(logo, "PNG", 15, 10, 25, 15);

        // Header
        doc.setFontSize(16);
        doc.setTextColor(33, 33, 33);
        doc.text("Mihisara Grocery Order Report", pageWidth / 2, 30, {
            align: "center",
        });

        if (fromDate || toDate) {
            const from = fromDate ? fromDate.toLocaleDateString() : "Start";
            const to = toDate ? toDate.toLocaleDateString() : "Today";
            doc.setFontSize(10);
            doc.setTextColor(16, 185, 129);
            doc.text(`Report Period: ${from} - ${to}`, pageWidth / 2, 37, {
                align: "center",
            });
        }

        // Generation date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 15, 20, {
            align: "right",
        });

        let currentY = fromDate || toDate ? 50 : 45;

        // Product Sales Chart
        const salesNode = document.getElementById("product-sales-chart");
        if (salesNode) {
            doc.setFontSize(12);
            doc.setTextColor(33, 33, 33);
            doc.text("Product Sales Revenue", 15, currentY);

            const canvas = await html2canvas(salesNode, {
                useCORS: true,
                backgroundColor: "#ffffff",
                scale: 1.5,
            });
            const imgData = canvas.toDataURL("image/png");
            const chartHeight = 60;
            doc.addImage(imgData, "PNG", 15, currentY + 5, pageWidth - 30, chartHeight);
            currentY += chartHeight + 15;
        }

        // Sales by Category Chart
        const categoryNode = document.getElementById("sales-by-category-chart");
        if (categoryNode) {
            doc.setFontSize(12);
            doc.setTextColor(33, 33, 33);
            doc.text("Sales by Product Category", 15, currentY);

            const canvas = await html2canvas(categoryNode, {
                useCORS: true,
                backgroundColor: "#ffffff",
                scale: 1.5,
            });
            const imgData = canvas.toDataURL("image/png");
            const chartHeight = 60;
            doc.addImage(imgData, "PNG", 15, currentY + 5, pageWidth - 30, chartHeight);
            currentY += chartHeight + 15;
        }

        // Daily Orders Chart
        const ordersNode = document.getElementById("daily-orders-chart");
        if (ordersNode && currentY < pageHeight - 50) {
            doc.setFontSize(12);
            doc.setTextColor(33, 33, 33);
            doc.text("Daily Order Count", 15, currentY);

            const canvas = await html2canvas(ordersNode, {
                useCORS: true,
                backgroundColor: "#ffffff",
                scale: 1.5,
            });
            const imgData = canvas.toDataURL("image/png");
            const chartHeight = 60;
            doc.addImage(imgData, "PNG", 15, currentY + 5, pageWidth - 30, chartHeight);
            currentY += chartHeight + 15;
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Report generated by: System Administrator", 15, pageHeight - 15);
        doc.text("Mihisara Grocery Order Report System", 15, pageHeight - 10);
        doc.text("Page 1 / 1", pageWidth - 20, pageHeight - 10);

        doc.save("Mihisara_Grocery_Order_Report.pdf");
    };

    //  Beautiful full-screen loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 ">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-emerald-500 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2"></div>
                </div>

            </div>
        );
    }

    if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

    const { series, category } = data;

    return (
        <main className="p-6 space-y-6 bg-neutral-50 min-h-screen font-poppins">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Order Report</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Filter order analytics by date range and export the visible report.
                    </p>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <FiCalendar className="text-emerald-600" />
                            From:
                        </span>
                        <DatePicker
                            selected={fromDate}
                            onChange={(date) => setFromDate(date)}
                            dateFormat="dd/MM/yyyy"
                            maxDate={toDate || undefined}
                            placeholderText="dd/mm/yyyy"
                            className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 sm:w-44"
                        />
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                        <span className="text-sm font-semibold text-slate-600">To:</span>
                        <DatePicker
                            selected={toDate}
                            onChange={(date) => setToDate(date)}
                            dateFormat="dd/MM/yyyy"
                            minDate={fromDate || undefined}
                            placeholderText="dd/mm/yyyy"
                            className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 sm:w-44"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setFromDate(null);
                            setToDate(null);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Reset
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                        <FiDownload /> Export to PDF
                    </button>
                </div>
            </div>

            {/* Daily Orders Line Chart */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-bold text-neutral-900">Daily Order Count</h2>
                <div className="h-72 mt-4 pdf-chart-container" id="daily-orders-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="day" tick={{ fill: "#6b7280" }} />
                            <YAxis tick={{ fill: "#6b7280" }} />
                            <Tooltip formatter={(val) => [`${val} orders`, "Orders"]} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>


            {/* Sales by product category */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-bold text-neutral-900">Sales by product category</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                    <div className="lg:col-span-2 h-72 pdf-chart-container" id="sales-by-category-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={category}
                                    dataKey="amount"
                                    nameKey="category"
                                    outerRadius={110}
                                    label={(e) => `${e.category} ${e.percent}%`}
                                >
                                    {category.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>



            {/* Add CSS for PDF export */}
            <style jsx>{`
                @media print {
                    .pdf-chart-container {
                        background: white !important;
                        border: 1px solid #e5e7eb !important;
                        border-radius: 8px !important;
                    }
                    
                    .pdf-chart-container * {
                        background: white !important;
                    }
                }
            `}</style>
        </main>
    );
};

export default OrderReport;

