import { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { FiLogOut, FiEdit, FiSave, FiX, FiLock } from "react-icons/fi";
import { motion } from "framer-motion";
import Modal from "react-modal";

export default function ProfilePage() {
    const [me, setMe] = useState(null);
    const [orders, setOrders] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [completedOrders, setCompletedOrders] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [activeOrder, setActiveOrder] = useState(null);

    const formatCurrency = (value) =>
        Number(value || 0).toLocaleString("en-LK", {
            style: "currency",
            currency: "LKR",
        });

    const formatDate = (date) =>
        date ? new Date(date).toLocaleDateString("en-GB") : "-";

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        setMe({
            userId: decoded.userId,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            email: decoded.email,
            phone: decoded.contactNo,
        });

        setEditForm({
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            email: decoded.email,
            phone: decoded.contactNo || ""
        });

        axios
            .get(import.meta.env.VITE_BACKEND_URL+"/api/orders/my-orders", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : res.data?.orders || [];
                setOrders(data);

                // Calculate total spent and completed orders
                const total = data?.reduce((acc, order) => acc + order.total, 0) || 0;
                const completed = data?.filter(order => order.status === "completed" || order.status === "delivered").length || 0;


                setTotalSpent(total);
                setCompletedOrders(completed);
            })
            .catch(console.error);
    }, []);

    const showMessage = (msg, type = "success") => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form when canceling
            setEditForm({
                firstName: me.firstName,
                lastName: me.lastName,
                email: me.email,
                phone: me.phone || ""
            });
        }
        setIsEditing(!isEditing);
        setMessage("");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        const token = localStorage.getItem("token");
        if (!token || !me) return;

        // Basic validation
        if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
            showMessage("Please fill in all required fields", "error");
            return;
        }

        if (!/\S+@\S+\.\S+/.test(editForm.email)) {
            showMessage("Please enter a valid email address", "error");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/profile/${me.userId}`, // Corrected URL
                editForm,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.user && response.data.token) {
                // Update local state with new user data
                setMe(response.data.user);

                // Update token in localStorage
                localStorage.setItem("token", response.data.token);

                showMessage("Profile updated successfully!");
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Update error:", error);
            if (error.response?.data?.message) {
                showMessage(error.response.data.message, "error");
            } else {
                showMessage("Failed to update profile", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        window.location.href = "/forgot-password";
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("cart");
        window.location.href = "/login";
    };

    const statusBadge = (status = "") => {
        const s = status.toLowerCase();
        const base = "p-2 rounded-full text-xs font-semibold";
        if (s === "completed") return `${base} bg-green-100 text-green-700`;
        if (s === "processing") return `${base} bg-yellow-100 text-yellow-700`;
        if (s === "pending") return `${base} bg-orange-100 text-orange-600`;
        if (s === "returned") return `${base} bg-gray-100 text-gray-600`;
        return `${base} bg-red-100 text-red-600`;
    };

    return (
        <motion.div
            className="min-h-screen bg-gray-100 flex justify-center py-10 font-poppins"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75 }}
        >
            <div className="w-full max-w-5xl">
                {/* Top Bar */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors duration-300 delay-200"
                    >
                        <FiLogOut /> Logout
                    </button>
                </div>

                {/* Message Display */}
                {message && (
                    <motion.div
                        className={`mb-4 p-3 rounded-md ${
                            messageType === "success"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message}
                    </motion.div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden font-poppins">
                    {/* Name & avatar strip */}
                    <div className="flex items-center gap-4 p-6 border-b bg-gray-50">
                        <div className="h-16 w-16 rounded-full bg-dgreen flex items-center justify-center text-white text-xl font-bold">
                            {me?.firstName?.[0]}{me?.lastName?.[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {me?.firstName} {me?.lastName}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {me?.role}
                            </p>
                        </div>
                    </div>

                    {/* Personal Info section */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Personal Information
                            </h3>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            <FiSave /> {loading ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={handleEditToggle}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                                        >
                                            <FiX /> Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleEditToggle}
                                        className="flex items-center gap-2 px-4 py-2 bg-dgreen text-white rounded-md hover:bg-accent/60 transition"
                                    >
                                        <FiEdit /> Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <div>
                                <span className="font-medium">First Name: </span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={editForm.firstName}
                                        onChange={handleInputChange}
                                        className="border rounded px-3 py-2 w-full mt-1"
                                    />
                                ) : (
                                    me?.firstName
                                )}
                            </div>
                            <div>
                                <span className="font-medium">Last Name: </span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={editForm.lastName}
                                        onChange={handleInputChange}
                                        className="border rounded px-3 py-2 w-full mt-1"
                                    />
                                ) : (
                                    me?.lastName
                                )}
                            </div>
                            <div>
                                <span className="font-medium">Email: </span>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={editForm.email}
                                        onChange={handleInputChange}
                                        className="border rounded px-3 py-2 w-full mt-1"
                                    />
                                ) : (
                                    me?.email
                                )}
                            </div>
                            <div>
                                <span className="font-medium">User ID: </span>
                                {me?.userId}
                            </div>

                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleForgotPassword}
                                className="flex items-center gap-2 px-4 py-2 bg-dgreen text-white rounded-md hover:bg-dgreen/70 transition"
                            >
                                <FiLock /> Reset Password
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order Statistics */}
                <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
                            <p className="text-gray-600">Total Orders</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-dgreen">{completedOrders}</p>
                            <p className="text-gray-600">Completed Orders</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                                {totalSpent.toLocaleString("en-LK", {
                                    style: "currency",
                                    currency: "LKR",
                                })}
                            </p>
                            <p className="text-gray-600">Total Spent</p>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">My Orders</h3>
                    {orders.length > 0 && (
                        <div className="overflow-hidden rounded-xl bg-white shadow-md">
                            <div className="overflow-x-auto">
                                <table className="min-w-[760px] w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <Th>Order ID</Th>
                                        <Th>Date</Th>
                                        <Th>Items</Th>
                                        <Th>Total</Th>
                                        <Th>Status</Th>
                                        <Th className="text-center">Action</Th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                    {orders.map((order, index) => (
                                        <tr
                                            key={order._id || order.orderId || index}
                                            className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                        >
                                            <Td className="font-semibold text-emerald-700">
                                                {order.orderId}
                                            </Td>
                                            <Td>{formatDate(order.date || order.createdAt)}</Td>
                                            <Td>{order.products?.length || 0}</Td>
                                            <Td className="font-semibold">{formatCurrency(order.total)}</Td>
                                            <Td>
                                                <span className={statusBadge(order.status)}>
                                                    {order.status?.[0]?.toUpperCase() + order.status?.slice(1)}
                                                </span>
                                            </Td>
                                            <Td className="text-center">
                                                <button
                                                    onClick={() => setActiveOrder(order)}
                                                    className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                                                >
                                                    View
                                                </button>
                                            </Td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {orders.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md">
                            <p className="text-gray-500 text-lg">No orders found</p>
                            <p className="text-gray-400 mt-2">Start shopping to see your orders here!</p>
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={!!activeOrder}
                    onRequestClose={() => setActiveOrder(null)}
                    bodyOpenClassName="ReactModal__Body--open"
                    htmlOpenClassName="ReactModal__Html--open"
                    className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl outline-none"
                    overlayClassName="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-3 sm:p-6"
                >
                    {activeOrder && (
                        <>
                            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-700 sm:text-2xl">
                                        Order Details
                                    </h2>
                                    <p className="text-sm font-semibold text-slate-600">
                                        {activeOrder.orderId}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveOrder(null)}
                                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                                    aria-label="Close order details"
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Info label="Status">
                                        <span className={statusBadge(activeOrder.status)}>
                                            {activeOrder.status?.[0]?.toUpperCase() + activeOrder.status?.slice(1)}
                                        </span>
                                    </Info>
                                    <Info label="Date">{formatDate(activeOrder.date || activeOrder.createdAt)}</Info>
                                    <Info label="Total">{formatCurrency(activeOrder.total)}</Info>
                                    <Info label="Payment">{activeOrder.paymentStatus || "-"}</Info>
                                    <Info label="Delivery Method">{activeOrder.deliveryMethod || "-"}</Info>
                                    <Info label="Phone">{activeOrder.phone || "-"}</Info>
                                    <Info label="Address" className="sm:col-span-2">
                                        {activeOrder.address || "-"}
                                    </Info>
                                </div>

                                <div>
                                    <h3 className="mb-3 text-lg font-semibold text-slate-800">Products</h3>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="min-w-[620px] w-full text-sm">
                                            <thead className="bg-emerald-600 text-white">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Product</th>
                                                <th className="px-3 py-2 text-center">Qty</th>
                                                <th className="px-3 py-2 text-right">Price</th>
                                                <th className="px-3 py-2 text-right">Subtotal</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                            {activeOrder.products?.map((item, index) => {
                                                const price = Number(item.productInfo?.price || item.price || 0);
                                                const qty = Number(item.quantity || item.qty || 0);
                                                return (
                                                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium text-slate-800">
                                                                {item.productInfo?.name || item.productId || "Product"}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {item.productInfo?.productId || item.productId || ""}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">{qty}</td>
                                                        <td className="px-3 py-2 text-right">{formatCurrency(price)}</td>
                                                        <td className="px-3 py-2 text-right font-semibold">
                                                            {formatCurrency(price * qty)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-200 px-4 py-3 sm:px-6">
                                <button
                                    onClick={() => setActiveOrder(null)}
                                    className="rounded-lg bg-dgreen px-5 py-2 text-sm font-semibold text-white hover:bg-dgreen/80"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    )}
                </Modal>

                <style>{`
                    .ReactModal__Body--open,
                    .ReactModal__Html--open {
                        overflow: hidden;
                    }
                `}</style>
            </div>
        </motion.div>
    );
}

function Th({ children, className = "" }) {
    return (
        <th className={`px-4 py-3 text-xs font-semibold uppercase ${className}`}>
            {children}
        </th>
    );
}

function Td({ children, className = "" }) {
    return <td className={`px-4 py-4 text-slate-700 ${className}`}>{children}</td>;
}

function Info({ label, children, className = "" }) {
    return (
        <div className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 ${className}`}>
            <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
            <div className="mt-1 text-sm text-slate-800">{children}</div>
        </div>
    );
}
