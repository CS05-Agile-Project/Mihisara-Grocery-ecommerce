import { useState } from "react";
import Header from "../../components/header.jsx";
import Footer from "../../components/Footer.jsx";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ContactUs() {
    const [form, setForm] = useState({ comment: "", rating: 0 });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleStarClick = (value) => {
        setForm({ ...form, rating: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("⚠️ Please log in first before sending a message.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(import.meta.env.VITE_BACKEND_URL+"/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("✅ Your message was sent successfully!");
                setForm({ comment: "", rating: 0 });
            } else {
                toast.error("❌ " + (data.message || "Failed to send message."));
            }
        } catch (err) {
            console.error(err);
            toast.error("❌ Something went wrong. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-poppins">
            <main className="flex-grow">
                {/* Hero with Background Image + Gradient Overlay */}
                <motion.section
                    className="relative bg-cover bg-center text-white py-28"
                    style={{ backgroundImage: "url('/images/contact.png')" }}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30"></div>

                    <div className="relative max-w-4xl mx-auto text-center px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-lg">
                            Contact Us
                        </h1>
                        <p className="mt-6 text-lg md:text-2xl font-medium drop-shadow">
                            We’d love your feedback — leave a message and a rating.
                        </p>
                    </div>
                </motion.section>

                {/* Form Section */}
                <motion.section
                    className="max-w-3xl mx-auto px-6 py-12 bg-white rounded-2xl shadow-xl -mt-16 relative z-10 border border-gray-100 hover:shadow-2xl transition"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
                        Send Us Your Feedback
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="comment"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Your Message
                            </label>
                            <textarea
                                id="comment"
                                name="comment"
                                placeholder="Tell us what you think..."
                                value={form.comment}
                                onChange={handleChange}
                                rows="5"
                                className="border border-gray-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                required
                            />
                        </div>

                        {/* Star Rating */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Your Rating
                            </label>
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => handleStarClick(star)}
                                        className={`cursor-pointer text-3xl ${form.rating >= star
                                            ? "text-yellow-400"
                                            : "text-gray-300 hover:text-yellow-200"
                                        } transition`}
                                    >
                    ★
                  </span>
                                ))}
                                <span className="ml-3 text-sm text-gray-600">
                  {form.rating > 0 ? `${form.rating}/5` : "Select rating"}
                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                  <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                  >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </span>
                            ) : (
                                "Send Message"
                            )}
                        </button>
                    </form>
                </motion.section>

                {/* Contact Information + Map */}
                <motion.section
                    className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {/* Contact Info */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Get in Touch
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Have questions or feedback? We'd love to hear from you. Send us a
                            message and we'll respond as soon as possible.
                        </p>
                        <div className="space-y-5">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full">
                                    📍
                                </div>
                                <span>Mihisara Grocery, A2, Hikkaduwa, Sri Lanka.</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full">
                                    📞
                                </div>
                                <span>+94 717557972</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full">
                                    ✉️
                                </div>
                                <span>mihisaragrocery@gmail.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="rounded-xl overflow-hidden shadow-lg">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d126946.16404944127!2d80.0323757513158!3d6.121600417175072!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2slk!4v1757779881199!5m2!1sen!2slk"
                            width="100%"
                            height="350"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
