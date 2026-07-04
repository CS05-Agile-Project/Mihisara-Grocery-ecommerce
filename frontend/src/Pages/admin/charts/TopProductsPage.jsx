import { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

export default function TopProductsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(import.meta.env.VITE_BACKEND_URL+"/api/dashboard/top-products", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                    },
                });
                if (!r.ok) throw new Error(await r.text());
                setData(await r.json());
            } catch (e) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg text-emerald-700 font-medium">Loading chart…</p>
                </div>
            </main>
        );
    }

    if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

    return (
        <main className="p-6 bg-neutral-50 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-6">Top-Selling Products</h1>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }} // extra bottom for rotated labels
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: "#374151", fontSize: 12 }}
                                interval={0}
                                angle={-40}
                                textAnchor="end"
                            />
                            <YAxis
                                tick={{ fill: "#374151", fontSize: 12 }}
                                tickFormatter={(v) => `Rs ${v}`}
                            />
                            <Tooltip formatter={(v) => `Rs ${v.toLocaleString()}`} />
                            <Bar
                                dataKey="revenue"
                                fill="#10B981"
                                barSize={40}
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </main>
    );
}
