import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditSupplierPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const supplier = location.state || {};

  const [supplierId] = useState(supplier.supplierId || "");
  const [email, setEmail] = useState(supplier.email || "");
  const [name, setName] = useState(supplier.Name || "");
  const [contactNo, setContactNo] = useState(supplier.contactNo || "");
  const [submitting, setSubmitting] = useState(false);

  async function updateSupplier(e) {
    e?.preventDefault?.();
    if (submitting) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error("Supplier name and email are required");
      return;
    }
    if (contactNo.trim() && !/^\d{10}$/.test(contactNo.trim())) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/suppliers/${supplierId}`,
        {
          recordType: "supplier",
          email: email.trim(),
          Name: name.trim(),
          contactNo: contactNo.trim(),
        },
        { headers: { Authorization: "Bearer " + token } }
      );
      toast.success("Supplier updated successfully");
      navigate("/admin/suppliers");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update supplier");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 font-[var(--font-main)]">
      <div className="mx-auto max-w-3xl mb-4 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-dgreen">Edit Supplier</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update supplier profile details.
        </p>
      </div>

      <form
        onSubmit={updateSupplier}
        className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="p-4 md:p-6 space-y-5">
          <Field label="Supplier ID" value={supplierId} disabled />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Supplier Name *"
              placeholder="Enter supplier name"
              value={name}
              onChange={setName}
            />
            <Field
              label="Email *"
              type="email"
              placeholder="supplier@email.com"
              value={email}
              onChange={setEmail}
            />
          </div>

          <Field
            label="Contact No"
            placeholder="0711234567"
            value={contactNo}
            onChange={setContactNo}
          />
        </div>

        <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4 md:px-6 md:py-5 rounded-b-2xl flex items-center justify-end gap-3">
          <Link
            to="/admin/suppliers"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[.99]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-dgreen px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-dgreen/80 active:scale-[.99] disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Update Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        disabled={disabled}
        value={value}
        required={label.includes("*")}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
          disabled ? "bg-slate-100 cursor-not-allowed text-gray-500" : ""
        }`}
      />
    </div>
  );
}
