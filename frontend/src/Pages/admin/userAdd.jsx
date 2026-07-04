import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function AddUserPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName ] = useState("");
    const [email,     setEmail    ] = useState("");
    const [role,      setRole     ] = useState("customer");
    const [password,  setPassword ] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();

    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    async function addUser(e) {
        e?.preventDefault?.();
        if (submitting) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }

        const fn = firstName.trim();
        const ln = lastName.trim();
        const em = email.trim().toLowerCase();
        const pw = password;

        if (!fn || !ln || !em || !pw) {
            toast.error("Please fill all required fields");
            return;
        }
        if (!emailOk(em)) {
            toast.error("Please enter a valid email");
            return;
        }
        if (pw !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setSubmitting(true);
            const user = { firstName: fn, lastName: ln, email: em, password: pw, role };
            await axios.post(import.meta.env.VITE_BACKEND_URL+"/api/users", user, {
                headers: { Authorization: "Bearer " + token },
            });
            toast.success("User added successfully!");
            navigate("/admin/users");
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to add user");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 font-[var(--font-main)]">
            {/* Page header */}
            <div className="mx-auto max-w-3xl mb-4 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-dgreen">Add New User</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Create a user account with role-based access.
                </p>
            </div>

            {/* Card */}
            <form
                onSubmit={addUser}
                className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="p-4 md:p-6 space-y-5">
                    {/* Row 1 */}
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

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Email *"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={email}
                            onChange={setEmail}

                        />
                        <SelectField
                            label="Role *"
                            value={role}
                            onChange={setRole}
                            options={[
                                { value: "customer", label: "Customer" },
                                { value: "editor",   label: "Editor" },
                                { value: "admin",    label: "Admin" },
                            ]}
                        />
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PasswordField
                            label="Password *"
                            placeholder="••••••••"
                            value={password}
                            onChange={setPassword}
                            show={showPwd}
                            setShow={setShowPwd}

                        />
                        <PasswordField
                            label="Confirm Password *"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            show={showConfirm}
                            setShow={setShowConfirm}

                        />
                    </div>

                    {/* Tiny tip */}
                    <div className="text-[11px] text-slate-400">
                        Tip: Use at least 8 characters with a mix of letters and numbers.
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
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-lg bg-dgreen px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-dgreen/80 active:scale-[.99] disabled:opacity-60"
                    >
                        {submitting ? (
                            <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></span>
                Saving...
              </span>
                        ) : (
                            "Add User"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ---------- small input atoms (matching your new form style) ---------- */

function Field({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options = [] }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
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
        </div>
    );
}
