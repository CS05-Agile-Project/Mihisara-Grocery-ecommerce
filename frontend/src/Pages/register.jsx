import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import AuthTabs from "../components/AuthTabs.jsx";
import { motion } from "framer-motion"; // Import Framer Motion

export default function RegisterPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirm] = useState("");
    const [agree, setAgree] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    function validateForm() {
        const newErrors = {};

        if (!firstName.trim()) newErrors.firstName = "First name is required.";
        if (!lastName.trim()) newErrors.lastName = "Last name is required.";

        if (!email) newErrors.email = "Email is required.";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email.";

        if (!password) newErrors.password = "Password is required.";
        else if (password.length < 8) newErrors.password = "Password must be at least 8 characters.";

        if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
        else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

        if (!agree) newErrors.agree = "You must accept the Terms and Conditions.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleRegister(e) {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const response = await axios.post(import.meta.env.VITE_BACKEND_URL + "/api/users", {
                firstName,
                lastName,
                email,
                password,
            });

            if (response.data.message === "User created successfully") {
                toast.success("Registration successful");
                navigate("/login");
            } else {
                toast.error(response.data.message || "Registration failed");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
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
                    if (response.data.role === "admin") navigate("/admin/");
                    else navigate("/");
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
                        <img src="login.png" alt="Illustration" className="h-full w-full object-cover" />
                    </motion.div>

                    {/* Right form with animation */}
                    <motion.div
                        className="p-8 bg-white"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <AuthTabs />

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* First & Last name */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-xs "
                                    />
                                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-xs"
                                    />
                                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-xs"
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-xs"
                                />
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-xs"
                                />
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Terms */}
                            <label className="flex items-start gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                    className="mt-1 accent-accent"
                                />
                                <span>
                  I agree to the{" "}
                                    <Link to="/about" className="text-accent hover:underline">
                    Terms and Conditions
                  </Link>.
                </span>
                            </label>
                            {errors.agree && <p className="text-xs text-red-500 mt-1">{errors.agree}</p>}

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-accent text-white py-2 font-semibold hover:opacity-90 transition"
                            >
                                Create Account
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 border-t border-gray-200" />

                        {/* Social register */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={googleLogin}
                                className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
                            >
                                <FcGoogle className="text-xl" /> Continue with Google
                            </button>

                            {/* Privacy notice */}
                            <p className="mt-2 text-xs text-gray-500 text-center max-w-xs">
                                By continuing, you agree to our{" "}
                                <Link to="/about" className="text-accent hover:underline">
                                    Privacy Policy
                                </Link>{" "}
                                and{" "}
                                <Link to="/about" className="text-accent hover:underline">
                                    Terms of Service
                                </Link>.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
