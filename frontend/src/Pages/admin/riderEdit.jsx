import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditRiderPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Guard against direct navigation without state
    const initial = location.state || {};

    const [riderId] = useState(initial.riderId ?? ""); // immutable, disabled
    const [email, setEmail] = useState(initial.email ?? "");
    const [name, setName] = useState(initial.Name ?? ""); // capital N in schema
    const [contactNo, setContactNo] = useState(initial.contactNo ?? "");
    const [vehicleType, setVehicleType] = useState(initial.vehicleType ?? "");
    const [status, setStatus] = useState(Boolean(initial.status));
    const [submitting, setSubmitting] = useState(false);

    async function updateRider(e) {
        e?.preventDefault?.();
        if (submitting) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }

        if (!riderId || !email.trim() || !name.trim()) {
            toast.error("Please fill all required fields");
            return;
        }

        const body = {
            riderId, // keep in body though URL identifies the resource
            email: email.trim(),
            Name: name.trim(),
            contactNo: contactNo.trim(),
            vehicleType,
            status: Boolean(status),
        };

        try {
            setSubmitting(true);
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/riders/${riderId}`, body, {
                headers: { Authorization: "Bearer " + token },
            });
            toast.success("Rider updated successfully");
            navigate("/admin/riders");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to update rider");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6">
            {/* Title */}
            <div className="mx-auto max-w-3xl mb-4 text-center">
                <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-800">
                    Edit Rider
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Update rider contact details, vehicle and status.
                </p>
            </div>

            {/* Card */}
            <form
                onSubmit={updateRider}
                className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="p-4 md:p-6 space-y-5">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Rider ID *"
                            value={riderId}
                            onChange={() => {}}
                            disabled
                        />
                        <Field
                            label="Email *"
                            type="email"
                            placeholder="rider@email.com"
                            value={email}
                            onChange={setEmail}
                        />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Rider Name *"
                            placeholder="John Doe"
                            value={name}
                            onChange={setName}
                        />
                        <SelectField
                            label="Vehicle Type"
                            value={vehicleType}
                            onChange={setVehicleType}
                            options={[
                                { value: "", label: "Select vehicle type" },
                                { value: "Bike", label: "Bike" },
                                { value: "Scooter", label: "Scooter" },
                                { value: "Car", label: "Car" },
                                { value: "Van", label: "Van" },
                                { value: "Bicycle", label: "Bicycle" },
                                { value: "Other", label: "Other" },
                            ]}
                        />
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Contact No"
                            placeholder="0 71 123 4567"
                            value={contactNo}
                            onChange={setContactNo}
                        />

                        {/* active toggle */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-slate-700">
                                Status
                            </label>
                            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <input
                                    id="active"
                                    type="checkbox"
                                    className="h-4 w-4 accent-emerald-600"
                                    checked={status}
                                    onChange={(e) => setStatus(e.target.checked)}
                                />
                                <label htmlFor="active" className="text-sm text-slate-700">
                                    Active
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4 md:px-6 md:py-5 rounded-b-2xl flex items-center justify-end gap-3">
                    <Link
                        to="/admin/riders"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[.99]"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[.99] disabled:opacity-60"
                    >
                        {submitting ? (
                            <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></span>
                Saving...
              </span>
                        ) : (
                            "Update Rider"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}


function Field({
                   label,
                   value,
                   onChange,
                   placeholder,
                   type = "text",
                   disabled = false,
               }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">
                {label}
            </label>
            <input
                type={type}
                value={value}
                required
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                    disabled ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                }`}
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-slate-700">
                {label}
            </label>
            <select
                value={value}
                required
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
