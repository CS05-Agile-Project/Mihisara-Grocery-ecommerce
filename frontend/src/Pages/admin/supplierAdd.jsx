import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function AddSupplierPage() {
  const [supplierId, setSupplierId]   = useState("");
  const [productId, setProductId]     = useState("");
  const [email, setEmail]             = useState("");
  const [name, setName]               = useState("");
  const [stock, setStock]             = useState("");
  const [cost, setCost]               = useState("");
  const [contactNo, setContactNo]     = useState("");
  const [submitting, setSubmitting]   = useState(false);


  const navigate = useNavigate();

  async function addSupplier(e) {
    e?.preventDefault?.();
    if (submitting) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }

    // basic validation
    if (!supplierId.trim() || !productId.trim() || !email.trim() || !name.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      supplierId: supplierId.trim(),

      productId : productId.trim(),
      email     : email.trim(),
      Name      : name.trim(),              // backend expects capital N
      stock     : Number(stock) || 0,
      cost      : Number(cost) || 0,
      contactNo : contactNo.trim(),

    };

    try {
      setSubmitting(true);
      await axios.post(import.meta.env.VITE_BACKEND_URL+"/api/suppliers", payload, {

        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },

      });
      toast.success("Supplier added successfully");
      navigate("/admin/suppliers");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to add supplier");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 font-[var(--font-main)]">
        {/* Page header */}
        <div className="mx-auto max-w-3xl mb-4 text-center">

          <h1 className="text-2xl md:text-3xl font-bold text-dgreen">Add New Supplier</h1>

          <p className="text-sm text-slate-500 mt-1">
            Enter supplier details including product, contact, pricing, and stock.
          </p>
        </div>

        {/* Card */}
        <form
            onSubmit={addSupplier}
            className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="p-4 md:p-6 space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                  label="Supplier ID *"


                  placeholder="001"


                  value={supplierId}
                  onChange={setSupplierId}
              />
              <Field
                  label="Product ID *"
                  placeholder="BYNPD00001"
                  value={productId}
                  onChange={setProductId}
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                  label="Email *"
                  type="email"
                  placeholder="supplier@email.com"
                  value={email}
                  onChange={setEmail}
              />
              <Field
                  label="Supplier Name *"
                  placeholder="Acme Foods Pvt Ltd"
                  value={name}
                  onChange={setName}
              />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField
                  label="Stock"
                  placeholder="0"
                  value={stock}
                  onChange={setStock}
                  min={0}
              />
              <NumberField
                  label="Cost (LKR)"
                  placeholder="0.00"
                  value={cost}
                  onChange={setCost}
                  step="0.01"
                  min={0}
              />
              <Field
                  label="Contact No"


                  placeholder="071 123 4567"


                  value={contactNo}
                  onChange={setContactNo}
              />
            </div>

            {/* Helper tip */}
            <div className="text-[11px] text-slate-400">

              Tip: Use consistent IDs (e.g., <span className="font-semibold">SUP-101</span>) and ensure the product ID exists.

            </div>
          </div>

          {/* Footer actions */}
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
              {submitting ? (
                  <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></span>
                Saving...
              </span>
              ) : (
                  "Add Supplier"
              )}
            </button>
          </div>
        </form>
      </div>
  );
}


function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}


            required


            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
  );
}

function NumberField({ label, value, onChange, placeholder, min, step }) {
  return (
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-semibold text-slate-700">{label}</label>
        <input
            type="number"
            value={value}
            min={min}
            step={step}


            required

            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
  );
}
