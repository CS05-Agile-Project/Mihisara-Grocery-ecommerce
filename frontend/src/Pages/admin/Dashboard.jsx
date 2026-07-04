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
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";

const card =
    "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow";
const h2 = "text-2xl font-bold text-neutral-900";
const sub = "text-sm text-neutral-500";
const kpi = "text-2xl md:text-3xl font-extrabold tracking-tight";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        let alive = true;
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
    }, []);

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

    // 🌟 Beautiful full-screen loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 ">
                <div className="relative">
                    {/* spinning ring */}
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    {/* pulsing center */}
                    <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-emerald-500 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <p className="mt-6 text-lg font-semibold text-emerald-600">
                    Loading Dashboard…
                </p>
            </div>
        );
    }

    if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

    const { kpis, series, category } = data;

    return (
        <main className="p-6 space-y-6 bg-neutral-50 min-h-screen font-poppins">
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>

            {/* KPIs */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Total customers" value={kpis.totalCustomers} delta={kpis.deltaCustomers} />
                <KpiCard label="Total riders" value={kpis.totalRiders} delta={kpis.deltaRiders} />
                <KpiCard label="Total orders" value={kpis.totalOrders} delta={kpis.deltaOrders} />
                <KpiCard label="Total returns" value={kpis.totalReturns} delta={kpis.deltaReturns} />
            </section>

            {/* Product sales – Revenue only */}
            <section className={card}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={h2}>Order Sales</h2>
                    <div className="text-sm text-neutral-500">Last {series.length} days</div>
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={series} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="day" tick={{ fill: "#6b7280" }} />
                            <YAxis tick={{ fill: "#6b7280" }} tickFormatter={(v) => `Rs ${v}`} />
                            <Tooltip
                                formatter={(val) => [`Rs ${val.toLocaleString()}`, "Revenue"]}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="revenue"
                                name="Revenue"
                                fill="#6366F1"
                                barSize={30}
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Category + Daily Orders */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={card}>
                    <h2 className={h2}>Sales by product category</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                        <div className="lg:col-span-2 h-72">
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
                        <ul className="space-y-2">
                            {category.map((c, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{c.category}</span>
                                    <span className="text-neutral-500">{c.percent}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Daily Orders Line Chart */}
                <div className={card}>
                    <h2 className={h2}>Daily Order Count</h2>
                    <div className="h-72 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={series} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="day" tick={{ fill: "#6b7280" }} />
                                <YAxis tick={{ fill: "#6b7280" }} />
                                <Tooltip
                                    formatter={(val) => [`${val} orders`, "Orders"]}
                                    contentStyle={{
                                        backgroundColor: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                    }}
                                />
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
                </div>
            </section>
        </main>
    );
}

function KpiCard({ label, value, delta, prefix = "" }) {
    const up = "ml-2 text-emerald-600 text-xs font-semibold";
    const down = "ml-2 text-rose-600 text-xs font-semibold";
    return (
        <div className={card}>
            <div className={sub}>{label}</div>
            <div className={kpi}>
                {prefix}
                {value?.toLocaleString?.() ?? 0}
                {delta !== undefined && (
                    <span className={delta >= 0 ? up : down}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta || 0).toFixed(1)}%
          </span>
                )}
            </div>
        </div>
    );
}
