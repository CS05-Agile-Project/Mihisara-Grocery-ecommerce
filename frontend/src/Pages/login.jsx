import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import AuthTabs from "../components/AuthTabs.jsx";
import { motion } from "framer-motion"; // Import Framer Motion

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const navigate = useNavigate();

    function validateForm() {
        const newErrors = { email: "", password: "" };
        if (!email) newErrors.email = "Email is required.";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email address.";
        if (!password) newErrors.password = "Password is required.";
        setErrors(newErrors);
        return !newErrors.email && !newErrors.password;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const res = await axios.post(import.meta.env.VITE_BACKEND_URL + "/api/users/login", {
                email,
                password,
            });
            toast.success("Login successful");
            localStorage.setItem("token", res.data.token);
            if (res.data.role === "admin") navigate("/admin/");
            else navigate("/");
        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
        }
    }

    const googleLogin = useGoogleLogin({
        onSuccess: (response) => {
            const accessToken = response.access_token;
            axios
                .post(import.meta.env.VITE_BACKEND_URL + "/api/users/login/google", {
                    accessToken,
                })
                .then((response) => {
                    toast.success("Login Successful");
                    const token = response.data.token;
                    localStorage.setItem("token", token);
                    if (response.data.role === "admin") {
                        navigate("/admin/");
                    } else {
                        navigate("/");
                    }
                });
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/bg02.png')] font-poppins">
            <div className="w-screen min-h-screen backdrop-blur-xs flex flex-col relative items-center justify-center">
                <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-md border border-gray-200">
                    {/* Left image with animation */}
                    <motion.div
                        className="hidden md:block bg-gray-100"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <img src="/register.png" alt="Illustration" className="h-full w-full object-cover" />
                    </motion.div>

                    {/* Right form with animation */}
                    <motion.div
                        className="p-8 bg-white font-poppins"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <AuthTabs />

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-xs"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent  placeholder:text-xs"
                                    required
                                    minLength={8}
                                />
                                {errors.password && (
                                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                                )}

                                {/* Forgot password */}
                                <div className="mt-1 text-right">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/forget")}
                                        className="relative group text-xs text-gray-500 hover:text-accent font-poppins"
                                    >
                                        Forgot your password?
                                        <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full"></span>
                                    </button>

                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-accent text-white py-2 font-semibold hover:opacity-90 transition"
                            >
                                Log In
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 border-t border-gray-200" />

                        {/* Social login */}
                        <div className="flex flex-col items-center mt-4">
                            <button
                                type="button"
                                className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
                                onClick={googleLogin}
                            >
                                <FcGoogle className="text-xl" /> Continue with Google
                            </button>

                            {/* Privacy text */}
                            <p className="mt-2 text-xs text-gray-500 text-center max-w-s">
                                We respect your privacy. Your login details are securely encrypted and will never be shared with third parties.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
