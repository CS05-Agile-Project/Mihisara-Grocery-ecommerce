import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function EditUserPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId: userIdFromParams } = useParams();

    const initial = location?.state || {};
    const [userId, setUserId]       = useState(initial.userId || userIdFromParams || "");
    const [firstName, setFirstName] = useState(initial.firstName || "");
    const [lastName, setLastName]   = useState(initial.lastName || "");
    const [email, setEmail]         = useState(initial.email || "");
    const [role, setRole]           = useState(initial.role || "");
    const [password, setPassword]   = useState("");

    const [isLoading, setIsLoading]     = useState(!initial.userId && !!userIdFromParams);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const commonRoles = useMemo(
        () => ["admin", "manager", "staff", "customer"],
        []
    );

    useEffect(() => {
        async function fetchOne() {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please login first");
                navigate("/login");
                return;
            }
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userIdFromParams}`, {
                    headers: { Authorization: "Bearer " + token },
                });
                const u = res.data || {};
                setUserId(u.userId || u._id || "");
                setFirstName(u.firstName || "");
                setLastName(u.lastName || "");
                setEmail(u.email || "");
                setRole(u.role || "");
            } catch (e) {
                toast.error(e.response?.data?.message || "Failed to load user");
                navigate("/admin/users");
            } finally {
                setIsLoading(false);
            }
        }
        if (!initial.userId && userIdFromParams) fetchOne();
    }, [initial.userId, navigate, userIdFromParams]);

    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    async function updateUser(e) {
        e?.preventDefault?.();
        if (!userId) {
            toast.error("Missing userId");
            return;
        }
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !role.trim()) {
            toast.error("Please fill all required fields");
            return;
        }
        if (!emailOk(email.trim())) {
            toast.error("Please enter a valid email");
            return;
        }

        setIsSubmitting(true);
        try {
            const body = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                role: role.trim(),
            };
            if (password.trim()) body.password = password.trim();

            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, body, {
                headers: {
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json",
                },
            });

            toast.success("✅ User updated successfully");
            navigate("/admin/users");
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to update user");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 bg-gray-50">
                <div className="w-full min-h-[60vh] flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 font-[var(--font-main)]">
            {/* Page header */}
            <div className="mx-auto max-w-3xl mb-4 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-dgreen">Edit User</h1>
                <p className="text-sm text-slate-500 mt-1">Update account details and role.</p>
            </div>

            {/* Card */}
            <form
                onSubmit={updateUser}
                className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="p-4 md:p-6 space-y-5">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="User ID" value={userId} disabled />
                        <SelectField
                            label="Role *"
                            value={role}
                            onChange={setRole}
                            options={commonRoles.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
                            placeholder="Select role"
                        />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="First Name *"
                            placeholder="John"
                            value={firstName}
                            onChange={setFirstName}
                        />
                        <Field
                            label="Last Name *"
                            placeholder="Doe"
                            value={lastName}
                            onChange={setLastName}
                        />
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Email *"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={email}
                            onChange={setEmail}
                        />

                    </div>

                    <div className="text-[11px] text-slate-400">
                        Tip: Use a strong password with a mix of letters, numbers, and symbols.
                    </div>
                </div>

                {/* Footer actions */}
                <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4 md:px-6 md:py-5 rounded-b-2xl flex items-center justify-end gap-3">
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[.99]"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center rounded-lg bg-dgreen px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-dgreen/80 active:scale-[.99] disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></span>
                Saving...
              </span>
                        ) : (
                            "Update User"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ------------------- inputs matching your card design ------------------- */

function Field({ label, value, onChange, placeholder, type = "text", disabled = false }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <input
                type={type}
                disabled={disabled}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                required
                className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                    disabled ? "bg-slate-100 cursor-not-allowed" : ""
                }`}
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options = [], placeholder = "Select" }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <select
                value={value}
                required
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function PasswordField({ label, value, onChange, placeholder, show, setShow }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required
                    minLength="8"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs text-slate-600 hover:bg-slate-100"
                    title={show ? "Hide password" : "Show password"}
                >
                    {show ? "Hide" : "Show"}
                </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
                Leave blank to keep the existing password.
            </p>
        </div>
    );
}
