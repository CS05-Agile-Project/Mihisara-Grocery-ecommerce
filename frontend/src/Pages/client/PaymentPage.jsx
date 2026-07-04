import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    useStripe,
    useElements,
    CardElement,
} from "@stripe/react-stripe-js";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import toast from "react-hot-toast";

const stripePromise = loadStripe("pk_test_51SHrno75jg306ay8OEPOFn46u50abxAJWeO1Rd4tCgzaLBEGpQXMGdiK30h9JJoGm7iwKu1W4nL0O6GBECd2zcnS006XN1AeFa");

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: "#32325d",
            fontFamily: "'Poppins', sans-serif",
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": { color: "#a0aec0" },
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
        },
    },
};

function PaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const { state } = useLocation();

    const amount = state?.amount || 0;
    const cart = state?.cart || [];

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [country, setCountry] = useState("Sri Lanka");
    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!amount) return;
        axios
            .post(`${import.meta.env.VITE_BACKEND_URL}/api/payment/create-intent`, {
                amount,
                currency: "usd", // Stripe doesn't support LKR directly
            })
            .then((res) => setClientSecret(res.data.clientSecret))
            .catch(() => toast.error("Failed to initialize payment"));
    }, [amount]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: { email, name },
            },
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        if (paymentIntent.status === "succeeded") {
            toast.success("✅ Payment successful!");

            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Please login to place order");
                    setLoading(false);
                    return;
                }

                // ✅ Real checkout data
                const details = state?.deliveryDetails || {};

                // ✅ Create order
                const orderInformation = {
                    name: `${details.firstName || name} ${details.lastName || ""}`.trim(),
                    phone: details.phone || "",
                    deliveryMethod: details.deliveryMethod || "pickup",
                    address:
                        details.deliveryMethod === "home"
                            ? `${details.street || ""}, ${details.city || ""}, ${details.province || ""}`.trim()
                            : "Pickup at store",
                    total: amount,
                    products: cart.map((c) => ({
                        productId: c.productId,
                        qty: Number(c.qty ?? c.quantity ?? 1),
                    })),
                };

                const orderRes = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/orders`,
                    orderInformation,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                toast.success("Order placed successfully!");
                toast.success("QR generated successfully!");

                // ✅ Step 2: Update the payment status to 'paid'
                const orderId = orderRes.data.orderId; // backend must return this
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/payment/paid`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Payment status updated ✅");

                // ✅ If home delivery, create delivery record too
                if (details.deliveryMethod === "home") {
                    try {
                        const orderId = orderRes.data.orderId; // backend must return orderId
                        await axios.post(
                            `${import.meta.env.VITE_BACKEND_URL}/api/delivery`,
                            { orderId, phone: details.phone },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        toast.success("Delivery started to process 🚚");
                    } catch (deliveryErr) {
                        console.error("Delivery creation failed:", deliveryErr);
                        toast.error("Order placed, but failed to start delivery");
                    }
                }

                localStorage.removeItem("cart");
                setTimeout(() => navigate("/"), 2000);
            } catch (err) {
                console.error(err);
                toast.error(err?.response?.data?.message || "Error placing order");
            } finally {
                setLoading(false);
            }
        }
    };




    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row justify-center items-start py-10 font-poppins">
            {/* LEFT: Order Summary */}
            <div className="w-full md:w-[40%] bg-white shadow border rounded-2xl p-8 mx-3">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>
                <ul className="divide-y divide-gray-200 mb-4">
                    {cart.map((item, idx) => (
                        <li key={idx} className="flex justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-500">
                                    Qty {item.quantity ?? item.qty} × LKR {item.price}
                                </p>
                            </div>
                            <span className="font-semibold text-gray-700">
                LKR {(item.price * (item.quantity ?? item.qty)).toFixed(2)}
              </span>
                        </li>
                    ))}
                </ul>

                <div className="flex justify-between pt-4 border-t font-semibold text-lg">
                    <span>Total</span>
                    <span>LKR {amount.toFixed(2)}</span>
                </div>
            </div>

            {/* RIGHT: Payment Form */}
            <div className="w-full md:w-[45%] bg-white shadow border rounded-2xl p-8 mx-3">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Pay with Card</h2>
                    <span className="text-xs text-amber-600 font-medium border border-amber-300 bg-amber-50 px-2 py-1 rounded">
            TEST MODE
          </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    {/* Card Details */}
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">
                            Card Information
                        </label>
                        <div className="border rounded-md p-3 shadow-sm">
                            <CardElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Use test card: 4242 4242 4242 4242
                        </p>
                    </div>

                    {/* Cardholder name */}
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">
                            Cardholder Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name on card"
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">
                            Country or Region
                        </label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option>Sri Lanka</option>
                            <option>India</option>
                            <option>Pakistan</option>
                            <option>United States</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={!stripe || loading}
                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg transition"
                    >
                        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm />
        </Elements>
    );
}
