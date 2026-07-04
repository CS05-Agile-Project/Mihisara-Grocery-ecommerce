/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
    FiCheckCircle,
    FiPackage,
    FiSearch,
    FiUserCheck,
    FiUserX,
    FiDownload, FiCalendar,
} from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-full text-emerald-700">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg font-semibold">Loading Deliveries...</p>
        </div>
    );
}

export default function AdminDeliveryPage() {
    const [deliveries, setDeliveries] = useState([]);
    const [riders, setRiders] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [fileType, setFileType] = useState("PDF");



    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        Promise.all([fetchDeliveries(), fetchRiders()]).finally(() =>
            setLoading(false)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchDeliveries() {
        try {
            const res = await axios.get(import.meta.env.VITE_BACKEND_URL+"/api/delivery", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDeliveries(res.data.deliveries || []);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to load deliveries");
        }
    }

    async function fetchRiders() {
        try {
            const res = await axios.get(import.meta.env.VITE_BACKEND_URL+"/api/delivery/active-riders", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRiders(res.data || []);
        } catch {
            toast.error("Failed to load active riders");
        }
    }


    async function assignRider(deliveryId, riderId) {
        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}`,
                { riderId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Rider assigned");
            fetchDeliveries();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Assign failed");
        }
    }

    const filtered = deliveries.filter((d) =>
        [d.deliveryId, d.orderId, d.phone]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const busyRiderIds = new Set(
        deliveries
            .filter((d) => d.riderId && d.status !== "completed")
            .map((d) => d.riderId)
    );

    // === Report Data based on selected date range ===
    const start = fromDate ? new Date(fromDate.setHours(0, 0, 0, 0)) : null;
    const end = toDate ? new Date(toDate.setHours(23, 59, 59, 999)) : null;

    const rangeDeliveries = deliveries.filter((d) => {
        if (d.status !== "completed" || !d.date) return false;
        const dd = new Date(d.date);
        if (start && dd < start) return false;
        return !(end && dd > end);

    });

    const riderMap = {};
    rangeDeliveries.forEach((d) => {
        riderMap[d.riderId] = (riderMap[d.riderId] || 0) + 1;
    });

    const chartData = Object.entries(riderMap).map(([riderId, count]) => ({
        name: riders.find((r) => r.riderId === riderId)?.Name || riderId,
        deliveries: count,
    }));

    const totalInRange = chartData.reduce((s, r) => s + r.deliveries, 0);
    const topThree = [...chartData]
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 3)
        .map((r, i) => ({
            rank: i + 1,
            rider: r.name,
            deliveries: r.deliveries,
            percentage: totalInRange
                ? ((r.deliveries / totalInRange) * 100).toFixed(1) + "%"
                : "0%",
            date:
                fromDate && toDate
                    ? `${fromDate.toISOString().slice(0, 10)} to ${toDate
                        .toISOString()
                        .slice(0, 10)}`
                    : "",
        }));

    // Helper to load the site logo for PDF
    const loadImage = (src) =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });

    // === Download Report ===
    const downloadReport = async () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both From and To dates first.");
            return;
        }

        const rangeText =  `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;

        if (fileType === "PDF") {
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // === Logo at top-left ===
            const logo = await loadImage("/logo123.png");
             if (logo) pdf.addImage(logo, "PNG", 14, 8, 30, 15);

            // Header text
            pdf.setFontSize(14);
            pdf.text("Mihisara Grocery Rider Delivery Report", 50, 16);
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 80, 16);

            // Title
            // === Title with underline ===
            pdf.setFontSize(16);
            pdf.setTextColor(255, 165, 0);

            const titleText = `Rider Delivery Report (${rangeText})`;
            const titleY = 30;
            const titleX = pageWidth / 2;

// Centered title
            pdf.text(titleText, titleX, titleY, { align: "center" });

// ✅ underline the title
            const titleWidth = pdf.getTextWidth(titleText);
            pdf.setDrawColor(255, 165, 0); // same orange as text
            pdf.line(
                titleX - titleWidth / 2,
                titleY + 2,                  // a few px below the text
                titleX + titleWidth / 2,
                titleY + 2
            );

            pdf.setTextColor(0); // reset for the rest of the document


            // Chart snapshot
            const chartElem = document.getElementById("report-chart");
            if (chartElem) {
                const canvas = await html2canvas(chartElem);
                const img = canvas.toDataURL("image/png");
                pdf.rect(14, 38, pageWidth - 28, 80);
                pdf.addImage(img, "PNG", 20, 43, pageWidth - 40, 70);
            }

            // Table with borders
            autoTable(pdf, {
                startY: 140,
                head: [["Rank", "Rider", "Deliveries", "Percentage", "Date Range"]],
                body: topThree.map((r) => [
                    r.rank,
                    r.rider,
                    r.deliveries,
                    r.percentage,
                    r.date,
                ]),
                theme: "grid",
                styles: {
                    halign: "center",
                    cellPadding: 3,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0],
                },
                headStyles: { fillColor: [240, 240, 240], textColor: 20 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                // ✅ Add a stylish title above the table
                didDrawPage: (data) => {
                    pdf.setFontSize(14);
                    pdf.setTextColor(34, 139, 34); // a nice green
                    pdf.setFont(undefined, "bold");
                    pdf.text(
                        "Top Riders Summary",
                        pdf.internal.pageSize.getWidth() / 2,
                        data.settings.startY -10,
                        { align: "center" }
                    );
                    pdf.setFont(undefined, "normal"); // reset for table text
                    pdf.setTextColor(0);
                },
            });

            // Footer
            pdf.setFontSize(9);
            pdf.text(
                "Report generated by: System Administrator",
                14,
                pageHeight - 20
            );
            pdf.text("Mihisara Grocery Rider Delivery System", 14, pageHeight - 15);
            pdf.text(`Page 1 / 1`, pageWidth - 20, pageHeight - 10);

            pdf.save(`Mihisara_Grocery_RiderReport_${rangeText}.pdf`);
        } else if (fileType === "Excel") {
            const ws = XLSX.utils.json_to_sheet(topThree);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Top3 Riders");
            XLSX.writeFile(wb, `Mihisara_Grocery_RiderReport_${rangeText}.xlsx`);
        } else if (fileType === "CSV") {
            const csv = Papa.unparse(topThree);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Mihisara_Grocery_RiderReport_${rangeText}.csv`;
            link.click();
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <main className="p-6 bg-neutral-50 min-h-screen space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
                Delivery Inventory
            </h1>

            {/* KPI cards */}
            <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <KpiCard label="Total Deliveries" value={deliveries.length} icon={<FiPackage />} />
                <KpiCard
                    label="Assigned Riders"
                    value={deliveries.filter((d) => d.riderId).length}
                    icon={<FiUserCheck />}
                />
                <KpiCard
                    label="Unassigned Riders"
                    value={deliveries.filter((d) => !d.riderId).length}
                    icon={<FiUserX />}
                />
                <KpiCard
                    label="Delivered Orders"
                    value={deliveries.filter((d) => d.status === "completed").length}
                    icon={<FiCheckCircle />}
                />
            </section>

            {/* Filters and report trigger */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4
            flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                {/* Left: Search */}
                <div className="relative w-full md:w-64">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search delivery/order/phone…"
                        className="w-full rounded-xl border border-gray-300 pl-10 pr-0 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Right: Date pickers + Button */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center text-emerald-600">
                        <FiCalendar className="text-xl" />
                    </div>
                    <span className="text-sm text-gray-600">From:</span>
                    <DatePicker
                        selected={fromDate}
                        onChange={(date) => setFromDate(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="dd/mm/yyyy"
                        className="border rounded-lg px-3 py-2 w-32"
                    />
                    <span className="text-sm text-gray-600">To:</span>
                    <DatePicker
                        selected={toDate}
                        onChange={(date) => setToDate(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="dd/mm/yyyy"
                        className="border rounded-lg px-3 py-2 w-32"
                    />

                    <button
                        onClick={() => {
                            if (!fromDate || !toDate) {
                                toast.error("Please select both From and To dates");
                                return;
                            }
                            setReportOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow"
                    >
                        Create report
                    </button>
                </div>
            </div>


            {/* Deliveries Table */}

            <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-emerald-700 text-white">
                    <tr>
                        <Th>Delivery ID</Th>
                        <Th>Order ID</Th>
                        <Th>Phone</Th>
                        <Th>Assigned Rider</Th>
                        <Th>Date</Th>
                        <Th className="text-center">Assign Rider</Th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {filtered.map((d, idx) => (
                        <tr key={d.deliveryId} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                            <Td>{d.deliveryId}</Td>
                            <Td>{d.orderId}</Td>
                            <Td>{d.phone || "-"}</Td>
                            <Td>{d.riderId || "Unassigned"}</Td>
                            <Td>{d.date ? new Date(d.date).toLocaleDateString("en-GB") : "-"}</Td>
                            <Td className="text-center">
                                <select
                                    defaultValue=""
                                    onChange={(e) =>
                                        e.target.value && assignRider(d.deliveryId, e.target.value)
                                    }
                                    className="border rounded-lg px-2 py-1 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="" disabled>
                                        Select Rider
                                    </option>
                                    {riders
                                        .filter((r) => !busyRiderIds.has(r.riderId))
                                        .map((r) => (
                                            <option key={r.riderId} value={r.riderId}>
                                                {r.Name}
                                            </option>
                                        ))}
                                </select>

                            </Td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Report Modal */}
            <Transition appear show={reportOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setReportOpen(false)}>
                    <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4">
                            <Dialog.Title className="text-xl font-bold text-center">
                                Mihisara Grocery Rider Delivery Report (
                                {fromDate && toDate
                                    ? `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
                                    : ""}
                                )
                            </Dialog.Title>

                            <div id="report-chart" className="h-64 border rounded-md">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 20, right: 20, left: 20, bottom: 70 }} // extra bottom for rotated labels & x-axis name
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            interval={0}                 // show all rider names
                                            angle={-30}                  // tilt labels
                                            textAnchor="end"
                                            tick={{ fontSize: 10 }}
                                            label={{
                                                value: "Rider Name",       // ✅ X-axis title
                                                position: "insideBottom",
                                                offset: -50,
                                                style: { textAnchor: "middle", fontSize: 12 },
                                            }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            label={{
                                                value: "Number of Deliveries", // ✅ Y-axis title
                                                angle: -90,
                                                position: "insideLeft",
                                                style: { textAnchor: "middle", fontSize: 12 },
                                            }}
                                        />
                                        <Tooltip />
                                        <Bar dataKey="deliveries" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>


                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
                                Top Riders Summary
                            </h3>
                            <table className="w-full border border-gray-300 text-sm mt-4 rounded-md">
                                <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 border">Rank</th>
                                    <th className="px-3 py-2 border">Rider</th>
                                    <th className="px-3 py-2 border">Deliveries</th>
                                    <th className="px-3 py-2 border">Percentage</th>
                                    <th className="px-3 py-2 border">Date Range</th>
                                </tr>
                                </thead>
                                <tbody>
                                {topThree.map((r) => (
                                    <tr key={r.rank} className="border-t even:bg-gray-50">
                                        <td className="px-3 py-2 border">{r.rank}</td>
                                        <td className="px-3 py-2 border">{r.rider}</td>
                                        <td className="px-3 py-2 border">{r.deliveries}</td>
                                        <td className="px-3 py-2 border">{r.percentage}</td>
                                        <td className="px-3 py-2 border">{r.date}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            <div className="flex justify-between items-center pt-4">
                                <div className="space-x-2">
                                    {["Excel", "PDF", "CSV"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFileType(type)}
                                            className={`px-3 py-1 rounded border ${
                                                fileType === type
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-white text-gray-700"
                                            }`}
                                        >
                                            {type} file
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={downloadReport}
                                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                                >
                                    <FiDownload /> Download
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </Transition>
        </main>
    );
}

function KpiCard({ label, value, icon }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid place-items-center h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 text-xl">
                {icon}
            </div>
            <div>
                <div className="text-sm text-gray-500">{label}</div>
                <div className="text-2xl font-bold mt-1">{value}</div>
            </div>
        </div>
    );
}
const Th = ({ children, className = "" }) => (
    <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }) => (
    <td className={`px-4 py-3 ${className}`}>{children}</td>
);
