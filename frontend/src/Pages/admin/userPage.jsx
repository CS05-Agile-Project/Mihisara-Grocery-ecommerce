// src/pages/admin/UserPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEdit, FaBan, FaUnlock, FaChartBar } from "react-icons/fa";
import { TiTick } from "react-icons/ti";


function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-emerald-700">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg font-semibold">Loading users...</p>
        </div>
    );
}


export default function UserPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);     // current working list (for current page view if you want)
    const [allUsers, setAllUsers] = useState([]); // source of truth used for filters + paging

    // filters + search
    const [selectedRole, setSelectedRole] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const navigate = useNavigate();

    // initial fetch
    useEffect(() => {
        if (!isLoading) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            setIsLoading(false);
            return;
        }

        axios
            .get(import.meta.env.VITE_BACKEND_URL+"/api/users", {
                headers: { Authorization: "Bearer " + token },
            })
            .then((res) => {
                const arr = Array.isArray(res.data) ? res.data : [];
                setAllUsers(arr);
                setUsers(arr);
                setIsLoading(false);
            })
            .catch((e) => {
                toast.error(e.response?.data?.message || "Failed to load users");
                setAllUsers([]);
                setUsers([]);
                setIsLoading(false);
            });
    }, [isLoading]);

    // unique roles for filter dropdown
    const roles = useMemo(() => {
        const set = new Set(
            allUsers.map((u) => (u.role || "").trim()).filter(Boolean)
        );
        return ["All", ...Array.from(set)];
    }, [allUsers]);

    function handleRoleChange(e) {
        setSelectedRole(e.target.value);
        setCurrentPage(1);
    }
    function handleStatusChange(e) {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    }

    // --- TOGGLE BLOCK / UNBLOCK ---
    async function toggleBlock(u) {
        const id = u?.userId || u?._id;
        if (!id) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }

        const nextValue = !u.isBlocked;

        // optimistic update (update both allUsers & users)
        const applyOptimistic = (list) =>
            list.map((it) =>
                (it.userId || it._id) === id ? { ...it, isBlocked: nextValue } : it
            );
        const revertOptimistic = (list) =>
            list.map((it) =>
                (it.userId || it._id) === id ? { ...it, isBlocked: u.isBlocked } : it
            );

        try {
            setAllUsers((prev) => applyOptimistic(prev));
            setUsers((prev) => applyOptimistic(prev));

            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/block/${id}`,
                { isBlocked: nextValue }, // explicit desired state
                { headers: { Authorization: "Bearer " + token } }
            );

            toast.success(
                res?.data?.message || (nextValue ? "User blocked" : "User unblocked")
            );
        } catch (e) {
            // revert
            setAllUsers((prev) => revertOptimistic(prev));
            setUsers((prev) => revertOptimistic(prev));
            toast.error(e.response?.data?.message || "Failed to update user status");
        }
    }

    // filter + search
    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();

        return allUsers.filter((u) => {
            const roleOk =
                selectedRole === "All" ||
                (u.role || "").toLowerCase() === selectedRole.toLowerCase();

            const statusOk =
                statusFilter === "All" ||
                (statusFilter === "Active" && !u.isBlocked) ||
                (statusFilter === "Blocked" && !!u.isBlocked);

            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
            const id = (u.userId || u._id || "").toString();

            const searchOk =
                !q ||
                name.toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                id.toLowerCase().includes(q);

            return roleOk && statusOk && searchOk;
        });
    }, [allUsers, selectedRole, statusFilter, searchQuery]);

    // pagination
    const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

    // summary counts
    const totalCount = allUsers.length;
    const activeCount = allUsers.filter((u) => !u.isBlocked).length;
    const blockedCount = allUsers.filter((u) => !!u.isBlocked).length;
    const adminCount = allUsers.filter(
        (u) => (u.role || "").toLowerCase() === "admin"
    ).length;

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoadingScreen />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full max-h-full overflow-y-auto p-6  font-[var(--font-main)]">
            <h1 className="text-3xl font-bold text-dgreen  text-left mb-1">
                User Management
            </h1>
            <p className="text-sm text-slate-500 mb-5">
                View, manage, and track customer orders
            </p>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                    <p className="text-gray-500 text-sm">Active</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                    <p className="text-gray-500 text-sm">Blocked</p>
                    <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                    <p className="text-gray-500 text-sm">Admins</p>
                    <p className="text-2xl font-bold text-indigo-600">{adminCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <select
                        value={selectedRole}
                        onChange={handleRoleChange}
                        className="border border-slate-300 rounded px-3 py-2"
                    >
                        {roles.map((r, i) => (
                            <option key={i} value={r}>
                                {r || "Unknown"}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="border border-slate-300 rounded px-3 py-2"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Blocked">Blocked</option>
                    </select>

                    <div className="flex items-center border border-slate-300 rounded px-2 py-1">
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-grow outline-none px-2 py-1"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-gray-500 hover:text-red-600 px-2"
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        to="/admin/user-report"
                        className="inline-flex items-center gap-2 bg-white border border-dgreen text-dgreen hover:bg-emerald-50 font-bold py-2 px-5 rounded-lg shadow-sm transition"
                    >
                        <FaChartBar />
                        User Report
                    </Link>
                    <Link
                        to="/admin/add-users"
                        className="bg-dgreen hover:bg-dgreen/80 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition"
                    >
                        + Add User
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="w-full h-full flex justify-center items-center">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <table className="min-w-full text-sm md:text-base">
                        <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="py-3 px-4 text-xs font-semibold uppercase text-left">User ID</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercaset text-left">Name</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase text-left">Email</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase text-left">Role</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase text-left">Status</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase text-center">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {currentUsers.length > 0 ? (
                            currentUsers.map((u, index) => {
                                const key = u.userId || u._id || index;
                                const name =
                                    `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—";
                                const isBlocked = !!u.isBlocked;

                                return (
                                    <tr
                                        key={key}
                                        className="hover:bg-slate-50 transition duration-200"
                                    >
                                        <td className="py-3 px-4 font-medium text-slate-700">
                                            {u.userId || u._id || "—"}
                                        </td>
                                        <td className="py-3 px-4">{name}</td>
                                        <td className="py-3 px-4 text-slate-700">
                                            {u.email || "—"}
                                        </td>
                                        <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {u.role || "—"}
                        </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {isBlocked ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                            Blocked
                          </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Active
                          </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => toggleBlock(u)}
                                                    className="p-2 rounded-full transition hover:scale-110"
                                                    title={isBlocked ? "Unblock" : "Block"}
                                                >
                                                    {isBlocked ? (
                                                        <TiTick className="text-green-600 w-7 h-7" /> // green unlock icon
                                                    ) : (
                                                        <FaBan className="text-red-600 w-5 h-5" />     // red ban icon
                                                    )}
                                                </button>


                                                <button
                                                    onClick={() =>
                                                        navigate("/admin/edit-users", { state: u })
                                                    }
                                                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition"
                                                    title="Edit"
                                                >
                                                    <FaEdit size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-6 text-slate-500 text-center">
                                    No users found
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    {/* Pagination */}
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
            )}
        </div>
    );
}
