import { useEffect, useState } from "react";
import {
    ResponsiveContainer, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function LineChartPage() {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(import.meta.env.VITE_BACKEND_URL+"/api/dashboard/overview", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                    },
                    credentials: "include",
                });
                if (!r.ok) throw new Error(await r.text());
                const j = await r.json();
                setSeries(j.series || []);
            } catch (e) { setErr(e.message); }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-emerald-500 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <p className="mt-6 text-lg font-semibold text-emerald-600">Loading Line Chart…</p>
            </div>
        );
    }
    if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

    return (
        <main className="p-6 bg-neutral-50 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-6">Line Chart – Daily Orders</h1>
            <div className="bg-white rounded-xl shadow p-4 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" tick={{ fill: "#6b7280" }} />
                        <YAxis tick={{ fill: "#6b7280" }} />
                        <Tooltip formatter={v => [`${v} orders`, "Orders"]} />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </main>
    );
}
