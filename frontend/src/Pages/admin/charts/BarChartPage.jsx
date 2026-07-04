import { useEffect, useState } from "react";
import {
    ResponsiveContainer, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function BarChartPage() {
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
                console.log("Received series:", j.series);  // Add this line to check the received series
                setSeries(j.series || []);
            } catch (e) {
                setErr(e.message);
            }
            setLoading(false);
        })();
    }, []);


    // 🌟 Beautiful Loading Screen
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
                <div className="relative">
                    {/* spinning circle */}
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    {/* pulsing dot */}
                    <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-emerald-500 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <p className="mt-6 text-lg font-semibold text-emerald-600">
                    Loading Bar Chart…
                </p>
            </div>
        );
    }

    if (err) {
        return <div className="p-6 text-rose-600">Error: {err}</div>;
    }

    return (
        <main className="p-6 bg-neutral-50 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-6">Bar Chart – Revenue</h1>
            <div className="bg-white rounded-xl shadow p-4 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" tick={{ fill: "#6b7280" }} />
                        <YAxis tick={{ fill: "#6b7280" }} tickFormatter={(v) => `Rs ${v}`} />
                        <Tooltip formatter={(v) => [`Rs ${v.toLocaleString()}`, "Revenue"]} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#6366F1" barSize={35} radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </main>
    );
}
