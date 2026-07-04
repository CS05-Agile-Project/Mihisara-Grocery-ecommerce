import { useEffect, useState, useMemo } from "react";
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from "recharts";

export default function PieChartPage() {
    const [category, setCategory] = useState([]);
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
                setCategory(j.category || []);
            } catch (e) { setErr(e.message); }
            setLoading(false);
        })();
    }, []);

    const COLORS = useMemo(
        () => ["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#3B82F6"],
        []
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-emerald-500 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <p className="mt-6 text-lg font-semibold text-emerald-600">Loading Pie Chart…</p>
            </div>
        );
    }
    if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

    return (
        <main className="p-6 bg-neutral-50 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-6">Pie Chart – Sales by Category</h1>
            <div className="bg-white rounded-xl shadow p-4 h-[500px] flex items-center justify-center">
                <ResponsiveContainer width="70%" height="100%">
                    <PieChart>
                        <Pie
                            data={category}
                            dataKey="amount"
                            nameKey="category"
                            outerRadius={180}
                            label={d => `${d.category} ${d.percent}%`}
                        >
                            {category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </main>
    );
}
