/* eslint-disable */
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FiCalendar } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Chart } from "chart.js/auto";

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-emerald-700">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg font-semibold">Loading Suppliers...</p>
        </div>
    );
}

export default function AdminSupplierPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 7;

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const navigate = useNavigate();
    const fmt = useMemo(
        () =>
            new Intl.NumberFormat("en-LK", {
                style: "currency",
                currency: "LKR",
                maximumFractionDigits: 2,
            }),
        []
    );

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleString("en-LK", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // ---------- Fetch suppliers ----------
    useEffect(() => {
        if (!isLoading) return;
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            setIsLoading(false);
            return;
        }
        axios
            .get(import.meta.env.VITE_BACKEND_URL+"/api/suppliers", {
                headers: { Authorization: "Bearer " + token },
            })
            .then((res) => {
                setSuppliers(Array.isArray(res.data) ? res.data : []);
                setIsLoading(false);
            })
            .catch((e) => {
                toast.error(e.response?.data?.message || "Failed to load suppliers");
                setSuppliers([]);
                setIsLoading(false);
            });
    }, [isLoading]);

    function deleteSupplier(supplierId) {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }
        axios
            .delete(import.meta.env.VITE_BACKEND_URL+"/api/suppliers/" + supplierId, {
                headers: { Authorization: "Bearer " + token },
            })
            .then(() => {
                toast.success("Supplier deleted successfully");
                setIsLoading(true);
            })
            .catch((e) => {
                toast.error(e.response?.data?.message || "Failed to delete Supplier");
            });
    }

    // ---------- Filters & pagination ----------
    const filteredSuppliers = suppliers.filter(
        (s) =>
            s.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.supplierId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
    const currentSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    //  Unique supplier names count
    const totalSuppliers = new Set(suppliers.map((s) => s.Name)).size;

    const totalStock = suppliers.reduce(
        (sum, s) => sum + (Number(s.stock) || 0),
        0
    );
    const totalCost = suppliers.reduce(
        (sum, s) => sum + (Number(s.cost) || 0),
        0
    );

    // ---------- Supplier Scorecard ----------
        const scorecard = useMemo(() => {
        const supplierGroups = {};
        suppliers.forEach((s) => {
            const key = s.Name || "Unknown";
            if (!supplierGroups[key]) supplierGroups[key] = [];
            supplierGroups[key].push(s);
        });

        return Object.entries(supplierGroups).map(([name, records]) => {
            // Group by productId within supplier
            const productGroups = {};
            records.forEach((r) => {
                const productKey = r.productId || "Unknown";
                if (!productGroups[productKey]) productGroups[productKey] = [];
                productGroups[productKey].push(r);
            });

            // --- Calculate price consistency per product ---
            const productConsistencies = Object.values(productGroups).map((prods) => {
                const unitPrices = prods
                    .map((r) => {
                        const stock = Number(r.stock) || 0;
                        const cost = Number(r.cost) || 0;
                        return stock > 0 ? cost / stock : 0;
                    })
                    .filter((p) => p > 0);

                if (unitPrices.length === 0) return 100; // no data = assume consistent

                const avg =
                    unitPrices.reduce((a, b) => a + b, 0) / unitPrices.length;
                const max = Math.max(...unitPrices);
                const min = Math.min(...unitPrices);
                const priceChange = avg > 0 ? ((max - min) / avg) * 100 : 0;
                return Math.max(0, 100 - priceChange);
            });

            // Average consistency across all products of this supplier
            const priceConsistency =
                productConsistencies.reduce((a, b) => a + b, 0) /
                (productConsistencies.length || 1);

            // --- Other metrics ---
            const totalPurchase = records.reduce(
                (sum, r) => sum + (Number(r.cost) || 0),
                0
            );
            const frequency = records.length;

            const purchaseScore = Math.min(100, totalPurchase / 100);
            const frequencyScore = Math.min(100, frequency * 20);

            const overallScore = Math.round(
                purchaseScore * 0.2 + frequencyScore * 0.2 + priceConsistency * 0.6
            );

            return {
                name,
                totalPurchase: totalPurchase.toFixed(2),
                frequency,
                priceConsistency: priceConsistency.toFixed(1),
                overallScore,
            };
        });
    }, [suppliers]);


    // ---------- Generate PDF ----------
      const handleCreateReport = async () => {
    if (!fromDate || !toDate) {
        toast.error("Please select a date range first");
        return;
    }

    try {
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // --- Header ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Mihisara Grocery Inventory & Supply Cost Analysis", pageWidth / 2, 25, {
        align: "center",
        });

        doc.setFontSize(9);
        doc.setTextColor(16, 185, 129);
        doc.text(
        `Report Period: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`,
        pageWidth / 2,
        31,
        { align: "center" }
        );

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 15, 15, {
        align: "right",
        });

        // --- Supplier Summary ---
        const summary = {};
        suppliers.forEach((s) => {
        const name = s.Name || "Unknown";
        if (!summary[name]) summary[name] = { stock: 0, cost: 0 };
        summary[name].stock += Number(s.stock) || 0;
        summary[name].cost += Number(s.cost) || 0;
        });

        const supplierData = Object.entries(summary).map(([name, data]) => ({
        name,
        stock: data.stock,
        cost: data.cost,
        }));

        const totalCost = supplierData.reduce((a, b) => a + b.cost, 0);

        // --- Chart (safe render with larger labels) ---
        const chartCanvas = document.createElement("canvas");
        chartCanvas.width = 450;
        chartCanvas.height = 230;
        document.body.appendChild(chartCanvas);
        const ctx = chartCanvas.getContext("2d");

        const chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: supplierData.map((s) => s.name),
            datasets: [
            {
                label: "Total Cost (LKR)",
                data: supplierData.map((s) => s.cost),
                backgroundColor: "#10B981",
            },
            ],
        },
        options: {
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
            x: {
                ticks: {
                color: "#000",
                font: { size: 18, weight: "bold" }, //  larger X-axis labels
                maxRotation: 45,
                minRotation: 0,
                },
            },
            y: {
                beginAtZero: true,
                ticks: { font: { size: 10 } },
            },
            },
        },
        });

        await new Promise((r) => setTimeout(r, 500));
        try {
        const chartImg = chartCanvas.toDataURL("image/png");
        doc.addImage(chartImg, "PNG", 20, 40, 170, 70);
        } catch (e) {
        console.error("Chart export failed:", e);
        doc.setTextColor(200, 0, 0);
        doc.text("Chart rendering failed", 20, 60);
        }

        chartInstance.destroy();
        document.body.removeChild(chartCanvas);

        // --- Table ---
        const tableData = supplierData.map((s) => [
        s.name,
        s.stock,
        fmt.format(s.cost),
        ((s.cost / totalCost) * 100).toFixed(1) + "%",
        ]);

        autoTable(doc, {
        startY: 120,
        head: [["Supplier", "Total Stock", "Total Cost (LKR)", "% of Cost"]],
        body: tableData,
        styles: { fontSize: 9, halign: "center" },
        headStyles: { fillColor: [16, 185, 129] },
        });

        // --- Footer (always at page bottom) ---
        const footerY = pageHeight - 15; //  fixed bottom margin
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Report generated by: System Administrator", 20, footerY - 5);
        doc.text("Mihisara Grocery Supplier Analysis System", 20, footerY);
        doc.text("Page 1 / 1", pageWidth - 20, footerY, { align: "right" });

        // --- Save PDF ---
        doc.save("Mihisara_Grocery_Supplier_Cost_Report.pdf");
        toast.success("Report generated successfully!");
    } catch (err) {
        console.error("PDF Generation Error:", err);
        toast.error("Failed to generate report. Check console for details.");
    }
    };


    if (isLoading)
        return (
            <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingScreen />
            </div>
        );

    return (
        <div className="relative w-full h-full p-6 font-[var(--font-main)]">
            {/* ---- Title ---- */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-dgreen">Suppliers Inventory</h1>
                <p className="text-gray-500 text-sm">
                    Manage your supplier details, stock, and contact information.
                </p>
            </div>

            {/* ---- Summary Cards ---- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <SummaryCard label="Total Suppliers" value={totalSuppliers} />
                <SummaryCard label="Total Stock" value={totalStock} />
                <SummaryCard label="Total Supply Cost" value={fmt.format(totalCost)} />
            </div>

            {/* ---- Supplier Scorecard ---- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Supplier Scorecard</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm md:text-base">
                        <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="py-2 px-4 text-left">Supplier</th>
                            <th className="py-2 px-4 text-center">Total Purchase (LKR)</th>
                            <th className="py-2 px-4 text-center">Order Frequency</th>
                            <th className="py-2 px-4 text-center">Price Consistency %</th>
                            <th className="py-2 px-4 text-center">Overall Score</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {scorecard.map((sc) => (
                            <tr key={sc.name} className="hover:bg-slate-50 transition">
                                <td className="py-2 px-4 font-medium">{sc.name}</td>
                                <td className="py-2 px-4 text-center">
                                    {fmt.format(sc.totalPurchase)}
                                </td>
                                <td className="py-2 px-4 text-center">{sc.frequency}</td>
                                <td className="py-2 px-4 text-center">{sc.priceConsistency}%</td>
                                <td className="py-2 px-4 text-center">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                            sc.overallScore >= 85
                                ? "bg-green-100 text-green-700"
                                : sc.overallScore >= 70
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-600"
                        }`}
                    >
                      {sc.overallScore}%
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ---- Search + Add ---- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center border border-slate-300 rounded px-2 py-1 w-full md:w-1/2">
                    <input
                        type="text"
                        placeholder="Search by name or supplier ID"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-grow outline-none px-2 py-1"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="text-gray-500 hover:text-red-600 px-2"
                        >
                            
                        </button>
                    )}
                </div>
                <Link
                    to="/admin/add-suppliers"
                    className="bg-dgreen hover:bg-dgreen/80 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition"
                >
                    + Add Supplier
                </Link>
            </div>

            {/* ---- Date Range + Report ---- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-4 mb-6">
                <div className="flex items-center text-emerald-600 gap-2">
                    <FiCalendar className="text-xl" />
                    <span className="text-sm text-slate-600 font-medium">From:</span>
                    <DatePicker
                        selected={fromDate}
                        onChange={(d) => setFromDate(d)}
                        dateFormat="dd/MM/yyyy"
                        className="border rounded px-3 py-1 text-sm"
                        placeholderText="dd/mm/yyyy"
                    />
                    <span className="text-sm text-slate-600 font-medium">To:</span>
                    <DatePicker
                        selected={toDate}
                        onChange={(d) => setToDate(d)}
                        dateFormat="dd/MM/yyyy"
                        className="border rounded px-3 py-1 text-sm"
                        placeholderText="dd/mm/yyyy"
                    />
                    <button
                        onClick={handleCreateReport}
                        className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm"
                    >
                        Create report
                    </button>
                </div>
            </div>

            {/* ---- Supplier Table ---- */}
            <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <table className="min-w-full text-sm md:text-base">
                    <thead className="bg-slate-50 text-slate-600">
                    <tr>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">
                            Supplie ID
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">Name</th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">Email</th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">
                            Product ID
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">Stock</th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">Cost</th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">
                            Contact No
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">Date</th>
                        <th className="py-3 px-4 text-xs font-semibold uppercase">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                    {currentSuppliers.length > 0 ? (
                        currentSuppliers.map((s, index) => (
                            <tr
                                key={s.supplierId || index}
                                className="hover:bg-slate-50 transition duration-200"
                            >
                                <td className="py-3 px-4 font-medium text-slate-700">
                                    {s.supplierId}
                                </td>
                                <td className="py-3 px-4">{s.Name || "-"}</td>
                                <td className="py-3 px-4">{s.email || "-"}</td>
                                <td className="py-3 px-4">{s.productId || "-"}</td>
                                <td className="py-3 px-4">{Number(s.stock) ?? 0}</td>
                                <td className="py-3 px-4">
                                    {typeof s.cost === "number" ? fmt.format(s.cost) : "-"}
                                </td>
                                <td className="py-3 px-4">{s.contactNo || "-"}</td>
                                <td className="py-3 px-4 text-gray-600">{formatDate(s.date)}</td>
                                <td className="py-3 px-4">
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={() =>
                                                navigate("/admin/edit-suppliers", { state: s })
                                            }
                                            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition"
                                        >
                                            <FaEdit size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteSupplier(s.supplierId)}
                                            className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={9}
                                className="py-6 text-slate-500 text-center italic"
                            >
                                No suppliers found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 bg-slate-50">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className={`px-4 py-2 rounded ${
                                currentPage === 1
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-slate-700 text-white hover:bg-slate-800"
                            }`}
                        >
                            Previous
                        </button>
                        <p className="text-slate-600 text-sm">
                            Page {currentPage} of {totalPages}
                        </p>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className={`px-4 py-2 rounded ${
                                currentPage === totalPages
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-slate-700 text-white hover:bg-slate-800"
                            }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-gray-500 text-sm">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

