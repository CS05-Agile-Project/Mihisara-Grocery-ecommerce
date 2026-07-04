import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BiMinus, BiPlus, BiTrash } from "react-icons/bi";
import { addToCart, addToCartQty, getCart, removeCart } from "../../utils/cart";
import { motion } from "framer-motion"; // Import Framer Motion

export default function CartPage() {
    const [cart, setCart] = useState(getCart());

    useEffect(() => {
        document.body.classList.remove("overflow-hidden");
        document.documentElement.classList.remove("overflow-hidden");
    }, []);

    const getQty = (it) => Number(it.qty ?? it.quantity ?? 0);

    /* ---------- Price Calculations ---------- */
    const originalTotal = useMemo(
        () =>
            cart.reduce(
                (sum, it) =>
                    sum + Number(it.labelledPrice || it.price || 0) * getQty(it),
                0
            ),
        [cart]
    );

    const saleTotal = useMemo(
        () =>
            cart.reduce(
                (sum, it) => sum + Number(it.price || 0) * getQty(it),
                0
            ),
        [cart]
    );

    const discount = useMemo(
        () => originalTotal - saleTotal,
        [originalTotal, saleTotal]
    );

    const itemsCount = useMemo(
        () => cart.reduce((n, it) => n + getQty(it), 0),
        [cart]
    );

    // final total (no tax)
    const total = saleTotal;

    /* ---------- Cart Operations ---------- */
    const updateQty = (item, delta) => {
        addToCartQty(item, delta);
        setCart(getCart());
    };

    const remove = (productId) => {
        removeCart(productId);
        setCart(getCart());
    };

    const clearCart = () => {
        localStorage.setItem("cart", JSON.stringify([]));
        window.dispatchEvent(new Event("cart-changed"));
        setCart([]);
    };

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 font-poppins">
            {/* Breadcrumb + Title */}
            <div className="mb-6">
                <p className="text-xs text-gray-500">
                    <Link to="/" className="hover:underline">Home</Link>{" "}
                    / <span className="text-gray-700">Shopping Cart</span>
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                    Shopping Cart
                </h1>
            </div>

            {/* Empty state */}
            {cart.length === 0 && (
                <div className="rounded-lg border border-dashed p-10 text-center text-gray-600">
                    Your cart is empty.{" "}
                    <Link to="/" className="text-emerald-600 underline hover:no-underline">
                        Continue shopping
                    </Link>
                </div>
            )}

            {/* Content */}
            {cart.length > 0 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left: Items */}
                    <motion.section
                        className="lg:col-span-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="hidden sm:grid grid-cols-12 rounded-t-xl bg-yellow-400/90 px-4 py-3 text-sm font-medium">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-2 text-center">Price</div>
                            <div className="col-span-2 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Subtotal</div>
                        </div>

                        <ul className="divide-y rounded-b-xl border">
                            {cart.map((item, index) => {
                                const qty = getQty(item);
                                const line = (Number(item.price || 0) * qty).toFixed(2);

                                return (
                                    <motion.li
                                        key={item.productId}
                                        className="grid grid-cols-12 items-center gap-4 px-4 py-4"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.05 }}
                                    >
                                        <div className="col-span-12 sm:col-span-6 flex items-center gap-3">
                                            <button
                                                onClick={() => remove(item.productId)}
                                                className="text-gray-400 hover:text-red-500"
                                                title="Remove item"
                                                aria-label={`Remove ${item.name}`}
                                            >
                                                <BiTrash size={18} />
                                            </button>

                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-16 w-16 rounded border object-cover"
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-gray-900 ">{item.name}</p>
                                                <p className="text-xs text-gray-500">ID: {item.productId}</p>
                                                <div className="mt-1 sm:hidden text-sm">
                                                    {Number(item.labelledPrice) > Number(item.price) ? (
                                                        <>
                              <span className="mr-2 text-gray-400 line-through">
                                {Number(item.labelledPrice).toFixed(2)}
                              </span>
                                                            <span className="font-semibold">
                                {Number(item.price).toFixed(2)}
                              </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-semibold">
                              {Number(item.price).toFixed(2)}
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price (desktop) */}
                                        <div className="col-span-6 hidden sm:block sm:col-span-2 text-center text-sm ">
                                            {Number(item.labelledPrice) > Number(item.price) ? (
                                                <>
                          <span className="text-gray-400 line-through block">
                            {Number(item.labelledPrice).toFixed(2)}
                          </span>
                                                    <span className="font-semibold block">
                            {Number(item.price).toFixed(2)}
                          </span>
                                                </>
                                            ) : (
                                                <span className="font-semibold">
                          {Number(item.price).toFixed(2)}
                        </span>
                                            )}
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-6 sm:col-span-2 flex justify-start sm:justify-center">
                                            <div className="inline-flex items-center rounded-lg border">
                                                <button
                                                    onClick={() => updateQty(item, -1)}
                                                    className="grid h-9 w-9 place-items-center"
                                                    aria-label="Decrease"
                                                >
                                                    <BiMinus />
                                                </button>
                                                <span className="w-10 text-center select-none">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQty(item, 1)}
                                                    className="grid h-9 w-9 place-items-center"
                                                    aria-label="Increase"
                                                >
                                                    <BiPlus />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Line total */}
                                        <div className="col-span-6 sm:col-span-2 text-left sm:text-right font-semibold">
                                            {line}
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </ul>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={clearCart}
                                className="text-sm text-emerald-700 hover:underline"
                            >
                                Clear Shopping Cart
                            </button>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <Feature title="Free Shipping" desc="Free shipping for order above LKR 20,000" />
                            <Feature title="Flexible Payment" desc="Multiple secure payment options" />
                            <Feature title="24×7 Support" desc="We support online all day." />
                        </div>
                    </motion.section>

                    {/* Right: Order Summary */}
                    <motion.aside
                        className="lg:col-span-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="rounded-xl border bg-white p-4 shadow-sm sticky top-20">
                            <h2 className="mb-3 text-lg font-semibold">Order Summary</h2>
                            <div className="divide-y text-sm">
                                <SummaryRow label="Items" value={itemsCount} />
                                <SummaryRow
                                    label="Sub Total (Original Price)"
                                    value={`LKR : ${originalTotal.toFixed(2)}`}
                                />
                                <SummaryRow
                                    label="Total Discount"
                                    value={`- LKR : ${discount.toFixed(2)}`}
                                />
                                {/* ✅ Shipping row logic */}
                                <SummaryRow
                                    label="Shipping"
                                    value={total > 20000 ? "Free" : "Pending"}
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between text-base">
                                <span className="font-medium">Total</span>
                                <span className="font-semibold">LKR : {total.toFixed(2)}</span>
                            </div>

                            <Link
                                to="/checkout"
                                state={{ cart }}
                                className="mt-4 block w-full rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Proceed to Checkout
                            </Link>

                            <Link
                                to="/"
                                className="mt-3 block w-full text-center text-sm text-gray-600 hover:text-gray-800"
                            >
                                &larr; Continue Shopping
                            </Link>
                        </div>
                    </motion.aside>
                </div>
            )}
        </main>
    );
}

/* helper components */
function SummaryRow({ label, value }) {
    return (
        <div className="flex items-center justify-between py-2 font-poppins">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900">{value}</span>
        </div>
    );
}

function Feature({ title, desc }) {
    return (
        <div className="rounded-xl border p-4 font-poppins">
            <div className="font-medium">{title}</div>
            <p className="text-sm text-gray-600">{desc}</p>
        </div>
    );
}
