import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";


export default function CheckoutPage() {
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        if (location.state?.paymentSuccess) {
            toast.success("Payment successful! You can now place your order.");
        }
    }, [location]);

    const cart = location.state?.cart || [];


    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [deliveryMethod, setDeliveryMethod] = useState("pickup");
    const [street, setStreet] = useState("");
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");
    const [zip, setZip] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState("cod");


    // ✅ Constant delivery fee for home delivery
    const DELIVERY_FEE = 350;

    const getQty = (item) => Number(item.qty ?? item.quantity ?? 0);
    const cartTotal = useMemo(
        () => cart.reduce((sum, item) => sum + Number(item.price) * getQty(item), 0),
        [cart]
    );

    // ✅ Final total including delivery fee if applicable
    const finalTotal = useMemo(
        () => (deliveryMethod === "home" ? cartTotal + DELIVERY_FEE : cartTotal),
        [cartTotal, deliveryMethod]
    );

    async function placeOrder() {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Please login to place order");
        if (!firstName.trim()) return toast.error("First name is required");
        if (!lastName.trim()) return toast.error("Last name is required");
        if (!/^\d{10}$/.test(phone.trim()))
            return toast.error("Phone number must be exactly 10 digits");

        if (deliveryMethod === "home") {
            if (!street.trim()) return toast.error("Street address is required");
            if (!city.trim()) return toast.error("City is required");
            if (!province.trim()) return toast.error("Province is required");
        }
        if (cart.length === 0) return toast.error("Your cart is empty");

        const orderInformation = {
            name: `${firstName} ${lastName}`.trim(),
            phone: phone.trim(),
            deliveryMethod,
            address: `${street} ${city} ${province}`.trim(),
            total: finalTotal, // ✅ send final total to backend
            products: cart.map((c) => ({
                productId: c.productId,
                qty: Number(c.qty ?? c.quantity ?? 1),
            })),
        };

        try {
            const res = await axios.post(
                import.meta.env.VITE_BACKEND_URL + "/api/orders",
                orderInformation,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Order placed successfully");
            toast.success("QR generated successfully");

// ✅ Step 1: Get the new orderId
            const orderId = res.data.orderId;

// ✅ Step 2: Update the payment column to "COD"
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/payment/COD`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Payment status set to COD 💵");

// ✅ Step 3: If home delivery, create delivery record
            if (deliveryMethod === "home") {
                await axios.post(
                    import.meta.env.VITE_BACKEND_URL + "/api/delivery",
                    { orderId, phone },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Delivery started to process 🚚");
            }

// ✅ Step 4: Clean up cart and navigate
            localStorage.removeItem("cart");
            setTimeout(() => navigate("/"), 2000);


            if (deliveryMethod === "home") {
                const orderId = res.data.orderId;

                await axios.post(
                    import.meta.env.VITE_BACKEND_URL+"/api/delivery",
                    { orderId, phone },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Error placing order");
        }
    }

    return (
        <div className="min-h-screen bg-white font-poppins">
            <div className="mx-auto w-full max-w-6xl px-4 py-10">
                {/* Header */}
                <p className="text-xs text-gray-500">
                    <Link to="/" className="hover:underline">Shopping Cart</Link>{" "}
                    / <span className="text-gray-700">Checkout</span>
                </p>
                <h1 className="text-left text-4xl font-bold">Checkout</h1>

                {/* Content */}
                <div className="mt-2 grid grid-cols-1 gap-10 lg:grid-cols-3 items-start">
                    {/* Left column */}
                    <section className="lg:col-span-2">
                        <h2 className="mb-6 text-sm font-semibold tracking-wider text-gray-700">
                            DELIVERY METHOD
                        </h2>

                        <div className="mb-6 flex gap-6">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="radio"
                                    value="pickup"
                                    checked={deliveryMethod === "pickup"}
                                    onChange={() => {
                                        setDeliveryMethod("pickup");
                                        setSelectedPayment("card"); // ✅ force card only for pickup
                                    }}

                                    className="h-4 w-4 text-emerald-600"
                                />
                                Store Pickup
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="radio"
                                    value="home"
                                    checked={deliveryMethod === "home"}
                                    onChange={() => setDeliveryMethod("home")}
                                    className="h-4 w-4 text-emerald-600"
                                />
                                Home Delivery
                            </label>
                        </div>

                        {deliveryMethod === "home" && (
                            <p className="mb-6 text-xs text-amber-600">
                                * Home delivery is available only within 5 km of our store.
                            </p>
                        )}

                        <h2 className="mb-6 text-sm font-semibold tracking-wider text-gray-700">
                            BILLING INFO
                        </h2>

                        <div className="space-y-6">
                            {deliveryMethod === "home" ? (
                                <>
                                    {/* Full form for home delivery */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">First Name *</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                                placeholder="First name"
                                                value={firstName}
                                                required
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">Last Name *</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                                placeholder="Last name"
                                                value={lastName}
                                                required
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Address *</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="Street address"
                                            required
                                            onChange={(e) => setStreet(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <input
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="Town / City"
                                            required
                                            onChange={(e) => setCity(e.target.value)}
                                        />
                                        <input
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="Province"
                                            required
                                            onChange={(e) => setProvince(e.target.value)}
                                        />
                                        <input
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="Postcode / Zip"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <input
                                            type="email"
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="you@example.com"
                                        />
                                        <input
                                            type="tel"
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="07X XXX XXXX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>

                                    <textarea
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                        placeholder="Notes about your order, e.g. special notes for delivery."
                                    />
                                </>
                            ) : (
                                <>
                                    {/* Minimal form for store pickup */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">First Name *</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                                placeholder="First name"
                                                value={firstName}
                                                required
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">Last Name *</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                                placeholder="Last name"
                                                value={lastName}
                                                required
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <input
                                            type="email"
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="you@example.com"
                                            required
                                        />
                                        <input
                                            type="tel"
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                            placeholder="07X XXX XXXX"
                                            value={phone}
                                            required
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>

                                    <textarea
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm outline-none focus:border-black"
                                        placeholder="Notes about your order, e.g. pickup instructions."
                                    />
                                </>
                            )}
                        </div>
                    </section>

                    {/* Right: Cart Totals + Payment */}
                    <aside className="space-y-6 lg:-mt-6">
                        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-700">
                                CART TOTALS
                            </h3>
                            <dl className="divide-y divide-gray-200 text-sm">
                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-gray-600">Cart Subtotal</dt>
                                    <dd className="font-medium">LKR : {cartTotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-gray-600">Processing and Handling</dt>
                                    <dd className="font-medium">
                                        {deliveryMethod === "home"
                                            ? `LKR : ${DELIVERY_FEE.toFixed(2)}`
                                            : "Free Shipping"}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <dt className="text-gray-600">Order Total</dt>
                                    <dd className="text-lg font-semibold">
                                        LKR : {finalTotal.toFixed(2)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Payment Method + Place Order */}
                        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-700 uppercase">
                                PAYMENT METHOD
                            </h3>

                            <div className="space-y-4 text-sm">
                                {/* Cash on Delivery — only available for Home Delivery */}
                                {deliveryMethod === "home" && (
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cod"
                                            checked={selectedPayment === "cod"}
                                            onChange={() => setSelectedPayment("cod")}
                                            className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-600"
                                        />
                                        <div>
                                            <div className="font-medium">Cash on Delivery</div>
                                            <p className="mt-1 text-gray-600">
                                                Pay with cash when your order is delivered.
                                            </p>
                                        </div>
                                    </label>
                                )}


                                {/* Credit / Debit Card */}
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="card"
                                        checked={selectedPayment === "card"}
                                        onChange={() => setSelectedPayment("card")}
                                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-600"
                                    />
                                    <div>
                                        <div className="font-medium">Credit / Debit Card</div>
                                        <p className="mt-1 text-gray-600">
                                            Secure online payment with Stripe using Visa, MasterCard, or Amex.
                                        </p>
                                    </div>
                                </label>

                                {/* PayPal (Coming soon) */}
                                <label className="flex cursor-not-allowed items-start gap-3 opacity-50">
                                    <input type="radio" name="payment" disabled className="mt-1 h-4 w-4" />
                                    <div>
                                        <div className="font-medium">PayPal</div>
                                        <p className="mt-1 text-gray-600">(Coming soon)</p>
                                    </div>
                                </label>
                            </div>

                            {/* ✅ Terms & Conditions */}
                            <div className="mt-6 flex items-center gap-2 border-t pt-4">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                />
                                <label htmlFor="terms" className="text-sm text-gray-700">
                                    I agree to the{" "}
                                    <Link to="/terms" className="text-emerald-600 underline hover:text-emerald-700">
                                        Terms & Conditions
                                    </Link>
                                    .
                                </label>
                            </div>

                            <button
                                onClick={() => {
                                    if (!selectedPayment) {
                                        toast.error("Please select a payment method");
                                        return;
                                    }

                                    // ✅ Prevent placing/redirecting without accepting terms
                                    if (!acceptedTerms) {
                                        toast.error("You must agree to the Terms & Conditions before proceeding");
                                        return;
                                    }

                                    // ✅ Common validation (same as COD)
                                    if (!firstName.trim()) return toast.error("First name is required");
                                    if (!lastName.trim()) return toast.error("Last name is required");
                                    if (!/^\d{10}$/.test(phone.trim()))
                                        return toast.error("Phone number must be exactly 10 digits");

                                    if (deliveryMethod === "home") {
                                        if (!street.trim()) return toast.error("Street address is required");
                                        if (!city.trim()) return toast.error("City is required");
                                        if (!province.trim()) return toast.error("Province is required");
                                    }

                                    if (cart.length === 0) return toast.error("Your cart is empty");

                                    // ✅ For Credit/Debit → redirect to payment if validation passes
                                    if (selectedPayment === "card") {
                                        navigate("/payment", {
                                            state: {
                                                amount: finalTotal,
                                                cart,
                                                deliveryDetails: {
                                                    firstName,
                                                    lastName,
                                                    phone,
                                                    deliveryMethod,
                                                    street,
                                                    province,
                                                    city,
                                                    zip,
                                                },
                                            },
                                        });
                                        return;
                                    }

                                    // ✅ For COD → normal backend order placement
                                    if (selectedPayment === "cod") {
                                        placeOrder();
                                    }
                                }}
                                disabled={!acceptedTerms}
                                className={`mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[.99] ${
                                    acceptedTerms
                                        ? "bg-black hover:bg-black/90 cursor-pointer"
                                        : "bg-gray-400 cursor-not-allowed"
                                }`}
                            >
                                {selectedPayment === "cod" ? "PLACE ORDER" : "PROCEED TO PAYMENT"}
                            </button>
                        </div>



                    </aside>
                </div>
            </div>
        </div>
    );
}
