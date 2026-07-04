import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ForgetPasswordPage() {
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();

    const passwordsMismatch =
        confirmPassword.length > 0 && newPassword !== confirmPassword;

    async function sendOtp(e) {
        e?.preventDefault();
        if (!email) return toast.error("Please enter your email.");
        setLoading(true);
        console.log("Backend URL is:", import.meta.env.VITE_BACKEND_URL);

        try {
            await axios.post(
                import.meta.env.VITE_BACKEND_URL+"/api/users/send-otp",
                { email }
            );
            setOtpSent(true);
            toast.success("OTP sent! Please check your inbox.");
        } catch (err) {
            console.error(err);
            toast.error("Unable to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function verifyOtp(e) {
        e?.preventDefault();

        // Frontend validation
        if (!otp) return toast.error("Please enter the OTP.");
        if (isNaN(Number(otp))) return toast.error("OTP must be a number.");
        if (!newPassword || !confirmPassword)
            return toast.error("Please fill both password fields.");
        if (newPassword.length < 8)
            return toast.error("Password must be at least 8 characters.");
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                import.meta.env.VITE_BACKEND_URL+"/api/users/reset-password",
                {
                    email,
                    otp: parseInt(otp, 10),
                    newPassword,
                }
            );
            toast.success("Password reset successful! Redirecting to login...");
            // Redirect to login after a short delay
            setTimeout(() => {
                navigate("/login", { replace: true, state: { fromReset: true } });
            }, 1200);
        } catch (err) {
            console.error(err);
            toast.error("Invalid OTP or request failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center font-poppins">
            <div className="w-full max-w-md mx-auto rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl p-6 border border-white/30">
                {!otpSent ? (
                    <form onSubmit={sendOtp} className="space-y-5">
                        <h1 className="text-2xl font-semibold text-center text-gray-900">
                            Forgot Password
                        </h1>
                        <p className="text-sm text-gray-600 text-center">
                            Enter your email and we’ll send you a one-time code.
                        </p>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">Email</span>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-lg text-white bg-dgreen hover:bg-secondary transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOtp} className="space-y-4">
                        <h1 className="text-2xl font-semibold text-center text-gray-900">
                            Verify & Reset
                        </h1>
                        <p className="text-sm text-gray-600 text-center">
                            Enter the OTP sent to <span className="font-medium">{email}</span>
                        </p>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">OTP</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter OTP"
                                className="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </label>

                        <div className="grid grid-cols-1 gap-4">
                            <label className="block">
                <span className="text-sm font-medium text-gray-800">
                  New Password
                </span>
                                <div className="mt-2 relative">
                                    <input
                                        type={showNew ? "text" : "password"}
                                        autoComplete="new-password"
                                        placeholder="Enter new password"
                                        className={`w-full h-12 px-4 pr-12 rounded-lg border ${
                                            passwordsMismatch ? "border-rose-400" : "border-gray-300"
                                        } focus:outline-none focus:ring-2 focus:ring-accent`}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        aria-invalid={passwordsMismatch}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        {showNew ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </label>

                            <label className="block">
                <span className="text-sm font-medium text-gray-800">
                  Confirm Password
                </span>
                                <div className="mt-2 relative">
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                        className={`w-full h-12 px-4 pr-12 rounded-lg border ${
                                            passwordsMismatch ? "border-rose-400" : "border-gray-300"
                                        } focus:outline-none focus:ring-2 focus:ring-accent`}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        aria-invalid={passwordsMismatch}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirm ? "Hide" : "Show"}
                                    </button>
                                </div>
                                {passwordsMismatch && (
                                    <p className="mt-1 text-sm text-rose-500">
                                        Passwords do not match.
                                    </p>
                                )}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || passwordsMismatch}
                            className="w-full h-12 rounded-lg text-white bg-dgreen hover:bg-secondary transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Verifying..." : "Verify OTP & Reset"}
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                                setOtp("");
                                setNewPassword("");
                                setConfirmPassword("");
                                setOtpSent(false); // go back to email step
                            }}
                            className="w-full h-11 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition disabled:opacity-60"
                        >
                            Resend / Change Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}