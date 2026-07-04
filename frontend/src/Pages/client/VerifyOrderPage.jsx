import { useParams } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export default function VerifyOrderPage() {
    const { orderId } = useParams();
    const [status, setStatus] = useState("Waiting for confirmation...");
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handleAccept = async () => {
        try {
            setLoading(true);
            setStatus("⏳ Verifying order...");

            // ✅ call backend POST route to accept
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/orders/verify/${orderId}/accept`);

            setStatus(`✅ Order ${orderId} has been completed successfully!`);
            setCompleted(true);
        } catch (err) {
            setStatus("❌ Failed to verify order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md text-center w-[90%] max-w-md">
                <h1 className="text-2xl font-bold text-emerald-700">Verify Your Order</h1>
                <p className="mt-2 text-gray-700">Order ID: <b>{orderId}</b></p>

                {/* Accept Button */}
                <button
                    onClick={handleAccept}
                    disabled={loading || completed}
                    className={`mt-5 px-6 py-2 rounded-lg text-white font-medium transition ${
                        completed
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                    }`}
                >
                    {completed ? "✅ Completed" : loading ? "Verifying..." : "Accept & Complete"}
                </button>

                {/* Status Message */}
                <p
                    className={`mt-4 text-lg font-semibold ${
                        status.startsWith("✅")
                            ? "text-green-600"
                            : status.startsWith("❌")
                                ? "text-red-600"
                                : "text-gray-600"
                    }`}
                >
                    {status}
                </p>
            </div>
        </div>
    );
}
