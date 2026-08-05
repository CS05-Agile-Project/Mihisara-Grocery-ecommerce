/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaChevronLeft, FaChevronRight, FaEdit, FaPlay, FaStop, FaTrash } from "react-icons/fa";
import { FiFilter, FiRefreshCw, FiPlus, FiDownload } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import { io } from "socket.io-client";


function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-emerald-700">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg font-semibold">Loading Riders...</p>
        </div>
    );
}

export default function AdminRiderPage() {
    const [riders, setRiders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const [status, setStatus] = useState("all");
    const [vehicle, setVehicle] = useState("all");
    const [reportOpen, setReportOpen] = useState(false);

    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);

    const [map, setMap] = useState(null);
    const socketRef = useRef(null);
    const ridersRef = useRef([]);
    const markersRef = useRef({});
    const stoppedRidersRef = useRef(new Set());
    const [liveMarkerCount, setLiveMarkerCount] = useState(0);

    useEffect(() => {
        ridersRef.current = riders;
    }, [riders]);

    // Load Google Maps script
    useEffect(() => {
        let mapInitialized = false;

        const tryInitMap = async () => {
            const el = document.getElementById("delivery-map");
            if (!el) {
                // Wait until element exists (especially on mobile)
                console.warn("Map container not ready yet.");
                requestAnimationFrame(tryInitMap);
                return;
            }

            if (mapInitialized) return;
            mapInitialized = true;

            try {
                // Load the Maps JS API dynamically (only once)
                if (!window.google || !window.google.maps) {
                    (g => {
                        var h, a, k,
                            p = "The Google Maps JavaScript API",
                            c = "google", l = "importLibrary", q = "__ib__", m = document, b = window;
                        b = b[c] || (b[c] = {});
                        var d = b.maps || (b.maps = {}),
                            r = new Set(),
                            e = new URLSearchParams,
                            u = () => h ||
                                (h = new Promise(async (f, n) => {
                                    await (a = m.createElement("script"));
                                    e.set("key", import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
                                    e.set("v", "weekly");
                                    e.set("callback", c + ".maps." + q);
                                    a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
                                    d[q] = f;
                                    a.onerror = () => (h = n(Error(p + " could not load.")));
                                    a.nonce = m.querySelector("script[nonce]")?.nonce || "";
                                    m.head.append(a);
                                }));
                        d[l]
                            ? console.warn(p + " only loads once. Ignoring:", g)
                            : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
                    })({});
                }

                const { Map } = await google.maps.importLibrary("maps");
                const m = new Map(el, {
                    center: { lat: 6.9271, lng: 79.8612 },
                    zoom: 11,
                    mapTypeControl: false,
                    streetViewControl: false,
                });
                setMap(m);
            } catch (err) {
                console.error("Failed to init map:", err);
            }
        };

        // Wait for next paint to ensure DOM ready
        requestAnimationFrame(tryInitMap);
    }, []);



    // Socket for live updates
    const socketURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io(socketURL, {
                transports: ["websocket"], // websocket only
                withCredentials: true,
            });
        }

        const socket = socketRef.current;
        const handleTrackingStopped = ({ riderId }) => {
            stoppedRidersRef.current.add(riderId);
            removeMarker(riderId);
        };

        socket.on("riderLocation", (loc) => {
            upsertMarker(loc);
        });
        socket.on("riderTrackingStopped", handleTrackingStopped);

        socket.on("disconnect", (reason) => {
            console.warn("Socket disconnected:", reason);
        });

        // cleanup listeners without disconnecting socket
        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("riderLocation");
            socket.off("riderTrackingStopped", handleTrackingStopped);
        };
    }, [map]);


    function upsertMarker(loc) {
        if (
            !map ||
            !window.google ||
            !loc?.riderId ||
            typeof loc?.lat !== "number" ||
            typeof loc?.lng !== "number"
        ) {
            return;
        }

        if (stoppedRidersRef.current.has(loc.riderId)) {
            return;
        }

        // Find rider's name from riders list if available
        const riderName =
            ridersRef.current.find((r) => r.riderId === loc.riderId)?.Name || loc.riderId;
        const existing = markersRef.current[loc.riderId];

        if (existing) {
            existing.setPosition({ lat: loc.lat, lng: loc.lng });
            existing.setTitle(`${riderName}`);
            return;
        }

        const marker = new window.google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map,
            title: `${riderName}`,
        });
        const info = new window.google.maps.InfoWindow({
            content: `<div style="min-width:160px">
                <b>${riderName}</b><br/>
                ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}<br/>
                <small>${new Date(loc.timestamp).toLocaleString()}</small>
            </div>`
        });
        marker.addListener("click", () => info.open({ anchor: marker, map }));
        markersRef.current[loc.riderId] = marker;
        setLiveMarkerCount(Object.keys(markersRef.current).length);
    }

    function removeMarker(riderId) {
        if (!riderId) return;
        const existing = markersRef.current[riderId];
        if (!existing) {
            return;
        }

        existing.setMap(null);
        delete markersRef.current[riderId];
        setLiveMarkerCount(Object.keys(markersRef.current).length);
    }

    async function syncLiveLocations() {
        if (!map) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/tracking/locations`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const locations = Array.isArray(res.data) ? res.data : [];
            const activeRiderIds = new Set(locations.map((loc) => loc?.riderId).filter(Boolean));

            Object.keys(markersRef.current).forEach((riderId) => {
                if (!activeRiderIds.has(riderId)) {
                    removeMarker(riderId);
                }
            });

            locations.forEach((loc) => {
                stoppedRidersRef.current.delete(loc.riderId);
                upsertMarker(loc);
            });
        } catch (error) {
            console.error("Failed to load live rider locations:", error);
        }
    }

    useEffect(() => {
        syncLiveLocations();
    }, [map, riders]);


    // ---------- Fetch Riders ----------
    useEffect(() => {
        if (!isLoading) return;
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            setIsLoading(false);
            return;
        }
        axios
            .get(import.meta.env.VITE_BACKEND_URL + "/api/riders", {
                headers: { Authorization: "Bearer " + token },
            })
            .then((res) => {
                // Sort riders by riderId in descending order
                const sorted = Array.isArray(res.data)
                    ? [...res.data].sort((a, b) => b.riderId.localeCompare(a.riderId))
                    : [];
                setRiders(sorted);
            })
            .catch((e) =>
                toast.error(e.response?.data?.message || "Failed to load riders")
            )
            .finally(() => setIsLoading(false));

    }, [isLoading]);

    function deleteRider(riderId) {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }
        axios
            .delete(`${import.meta.env.VITE_BACKEND_URL}/api/riders/${riderId}`, {
                headers: { Authorization: "Bearer " + token },
            })
            .then(() => {
                toast.success("Rider deleted successfully");
                setIsLoading(true);
            })
            .catch((e) =>
                toast.error(e.response?.data?.message || "Failed to delete rider")
            );
    }
    async function startTracking(rider) {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/tracking/start/${rider.riderId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            stoppedRidersRef.current.delete(rider.riderId);
            toast.success("Tracking link generated");
            await navigator.clipboard.writeText(res.data.trackingUrl);
            toast.success("Link copied to clipboard");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to start tracking");
        }
    }

    async function stopTracking(rider) {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/tracking/stop/${rider.riderId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            stoppedRidersRef.current.add(rider.riderId);
            removeMarker(rider.riderId);
            await syncLiveLocations();
            toast.success("Tracking stopped");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to stop tracking");
        }
    }


    const { total, activeCount, inactiveCount } = useMemo(() => {
        const total = riders.length;
        const activeCount = riders.filter((r) => !!r.status).length;
        const inactiveCount = total - activeCount;
        return { total, activeCount, inactiveCount };
    }, [riders]);

    const vehicleOptions = useMemo(() => {
        const set = new Set(
            riders.map((r) => r?.vehicleType).filter((v) => typeof v === "string" && v.trim())
        );
        return ["all", ...Array.from(set)];
    }, [riders]);

    const filtered = useMemo(() => {
        return riders.filter((r) => {
            const matchStatus =
                status === "all" ||
                (status === "active" && !!r.status) ||
                (status === "inactive" && !r.status);
            const matchVehicle =
                vehicle === "all" ||
                String(r.vehicleType || "").toLowerCase() === vehicle.toLowerCase();
            return matchStatus && matchVehicle;
        });
    }, [riders, status, vehicle]);

    useEffect(() => setPage(1), [status, vehicle, riders]);
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // ---------- Pie Chart Data ----------
    const vehicleStats = useMemo(() => {
        const counts = {};
        riders.forEach((r) => {
            const v = r.vehicleType || "Unknown";
            counts[v] = (counts[v] || 0) + 1;
        });
        const totalR = riders.length || 1;
        return Object.entries(counts).map(([type, count]) => ({
            type,
            count,
            pct: ((count / totalR) * 100).toFixed(1),
        }));
    }, [riders]);

    // ---------- Download PDF ----------
    const downloadPDF = async () => {
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();

        // Logo
        const logo = new Image();
        logo.src = "/logo123.png";
        await new Promise((resolve) => (logo.onload = resolve));
        doc.addImage(logo, "PNG", 15, 10, 25, 15);

        // Header
        doc.setFontSize(14);
        doc.text("Mihisara Grocery Vehicle Type Distribution Report", pageWidth / 2, 30, {
            align: "center",
        });
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 15, 18, {
            align: "right",
        });

        // Capture pie chart
        const node = document.getElementById("report-content");
        if (node) {
            const canvas = await html2canvas(node, {
                useCORS: true,
                backgroundColor: "#ffffff",
            });
            const img = canvas.toDataURL("image/png");
            doc.addImage(img, "PNG", 15, 35, pageWidth - 30, 90);
        }

        // Table below chart
        const tableData = vehicleStats.map((v) => [v.type, v.count, v.pct + "%"]);
        autoTable(doc, {
            startY: 135, // position below the chart
            head: [["Vehicle Type", "Count", "Percentage"]],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [16, 185, 129] }, // emerald
        });

        // Footer
        doc.setFontSize(9);
        doc.text("Report generated by: System Administrator", 15, 285);
        doc.text("Mihisara Grocery Rider Delivery System", 15, 290);
        doc.text("Page 1 / 1", pageWidth - 20, 290);

        doc.save("Mihisara_Grocery_Vehicle_Type_Report.pdf");
    };

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingScreen />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full p-4 font-[var(--font-main)]">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-emerald-700">
                        Riders Inventory
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage your delivery riders, availability and contact details.
                    </p>
                </div>
                <Link
                    to="/admin/add-riders"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                    <FiPlus className="text-base" /> Add Rider
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <StatCard title="Total Riders" value={total} pill="All" tone="emerald" />
                <StatCard title="Active Riders" value={activeCount} pill="Online" tone="green" />
                <StatCard title="Inactive Riders" value={inactiveCount} pill="Offline" tone="amber" />
            </div>

            {/* Filters */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                        <FiFilter />
                        <span className="text-sm font-medium">Filters</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm"
                        >
                            {vehicleOptions.map((v) => (
                                <option key={v} value={v}>
                                    {v === "all" ? "All Vehicles" : v}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setStatus("all");
                                setVehicle("all");
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <FiRefreshCw className="text-slate-500" /> Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Report Button */}
            <div className="mb-4 flex justify-end rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <button
                    onClick={() => setReportOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                    Create Report
                </button>
            </div>
            {/* Live Map Panel */}
            <section className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-lg">Rider Live Map</h2>
                    <p className="text-sm text-slate-500">
                        {liveMarkerCount} rider{liveMarkerCount === 1 ? "" : "s"} sharing their location
                    </p>
                </div>
                <div id="delivery-map" className="w-full h-[420px] rounded-lg" />
            </section>


            {/* Riders Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <Th>Rider ID</Th>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Contact No</Th>
                            <Th>Vehicle Type</Th>
                            <Th>Status</Th>
                            <Th className="text-center">Actions</Th>
                        </tr>
                        </thead>
                        <tbody>
                        {pageItems.map((r, index) => {
                            const key = r.riderId || r._id || index;
                            const isActive = !!r.status;
                            return (
                                <tr
                                    key={key}
                                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                >
                                    <Td>{r.riderId}</Td>
                                    <Td>{r.Name || "-"}</Td>
                                    <Td>{r.email || "-"}</Td>
                                    <Td>{r.contactNo || "-"}</Td>
                                    <Td>{r.vehicleType || "-"}</Td>
                                    <Td>
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                    }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
                                    </Td>
                                    <Td className="text-center">
                                        <div className="inline-flex items-center gap-3">
                                            <button
                                                onClick={() => startTracking(r)}
                                                className="p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                                                title="Start Tracking (copy link)"
                                                aria-label="Start tracking"
                                            >
                                                <FaPlay size={14} />
                                            </button>
                                            <button
                                                onClick={() => stopTracking(r)}
                                                className="p-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-600"
                                                title="Stop Tracking"
                                                aria-label="Stop tracking"
                                            >
                                                <FaStop size={14} />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    navigate("/admin/edit-riders", { state: r })
                                                }
                                                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200"
                                                title="Edit"
                                            >
                                                <FaEdit size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteRider(r.riderId)}
                                                className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-500"
                                                title="Delete"
                                            >
                                                <FaTrash size={18} />
                                            </button>
                                        </div>
                                    </Td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                    <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-lg border bg-white text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <span className="inline-flex items-center gap-2">
                            <FaChevronLeft size={12} />
                            Previous
                        </span>
                    </button>
                    <span className="text-sm text-slate-600">
      Page {page} of {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
    </span>
                    <button
                        onClick={() =>
                            setPage((p) =>
                                p < Math.ceil(filtered.length / PAGE_SIZE) ? p + 1 : p
                            )
                        }
                        disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}
                        className="px-3 py-1 rounded-lg border bg-white text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <span className="inline-flex items-center gap-2">
                            Next
                            <FaChevronRight size={12} />
                        </span>
                    </button>
                </div>
            </div>


            {/* Report Modal */}
            <Transition appear show={reportOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setReportOpen(false)}>
                    <div className="fixed inset-0 bg-black/40" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-white p-6 space-y-4 shadow-lg">
                            <Dialog.Title className="text-lg font-bold text-center">
                                Vehicle Type Distribution
                            </Dialog.Title>

                            {/* Chart content to export */}
                            <div id="report-content" className="min-h-[300px]">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={vehicleStats}
                                            dataKey="count"
                                            nameKey="type"
                                            outerRadius={100}
                                            label={({ name, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                        >
                                            {vehicleStats.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][i % 4]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={downloadPDF}
                                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                                >
                                    <FiDownload /> Download PDF
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}

/* ---- Small UI helpers ---- */
function StatCard({ title, value, pill, tone = "emerald" }) {
    const tones = {
        emerald: { ring: "ring-emerald-500/20", dot: "bg-emerald-500" },
        green: { ring: "ring-green-500/20", dot: "bg-green-500" },
        amber: { ring: "ring-amber-500/20", dot: "bg-amber-500" },
    }[tone];
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                        {title}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
                </div>
                <div
                    className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-2 ${tones.ring}`}
                >
                    <span className={`h-2 w-2 rounded-full ${tones.dot}`} />
                    {pill}
                </div>
            </div>
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
