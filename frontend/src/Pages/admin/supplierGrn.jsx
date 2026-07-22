import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash } from "react-icons/fi";

export default function SupplierGrnPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([{ productId: "", stock: "", cost: "" }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const supplierProfiles = useMemo(
    () => suppliers.filter((supplier) => supplier.recordType === "supplier"),
    [suppliers]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      setLoading(false);
      return;
    }

    Promise.all([
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/suppliers`, {
        headers: { Authorization: "Bearer " + token },
      }),
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products`, {
        headers: { Authorization: "Bearer " + token },
      }),
    ])
      .then(([supplierRes, productRes]) => {
        setSuppliers(Array.isArray(supplierRes.data) ? supplierRes.data : []);
        setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      })
      .catch((e) => toast.error(e.response?.data?.message || "Failed to load GRN data"))
      .finally(() => setLoading(false));
  }, []);

  function updateItem(index, field, value) {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", stock: "", cost: "" }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function createGrn(e) {
    e.preventDefault();
    if (submitting) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    const payloadItems = items.map((item) => ({
      productId: item.productId,
      stock: Number(item.stock),
      cost: Number(item.cost),
    }));

    if (
      payloadItems.some(
        (item) => !item.productId || !Number.isFinite(item.stock) || item.stock <= 0 || !Number.isFinite(item.cost) || item.cost < 0
      )
    ) {
      toast.error("Select products and enter valid stock/cost values");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/suppliers/grn`,
        { supplierId, items: payloadItems },
        { headers: { Authorization: "Bearer " + token } }
      );
      toast.success(`${res.data.grnId} created and inventory updated`);
      navigate("/admin/suppliers");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create GRN");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center text-emerald-700">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto py-6 px-3 md:px-6 font-[var(--font-main)]">
      <div className="mx-auto max-w-5xl mb-4 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-dgreen">Create GRN</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a supplier and add received products. Product inventory stock updates after creation.
        </p>
      </div>

      <form
        onSubmit={createGrn}
        className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="p-4 md:p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              required
            >
              <option value="">Select supplier</option>
              {supplierProfiles.map((supplier) => (
                <option key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.supplierId} - {supplier.Name}
                </option>
              ))}
            </select>
            {supplierProfiles.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                Add a supplier profile before creating a GRN.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800">Received Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <FiPlus /> Add Item
              </button>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 md:grid-cols-[1fr_140px_160px_auto]"
              >
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Product *
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.productId} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <NumberField
                  label="Stock *"
                  value={item.stock}
                  onChange={(value) => updateItem(index, "stock", value)}
                />
                <NumberField
                  label="Unit Cost (LKR) *"
                  value={item.cost}
                  onChange={(value) => updateItem(index, "cost", value)}
                  step="0.01"
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Remove item"
                  >
                    <FiTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4 md:px-6 md:py-5 rounded-b-2xl flex items-center justify-end gap-3">
          <Link
            to="/admin/suppliers"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || supplierProfiles.length === 0}
            className="inline-flex items-center justify-center rounded-lg bg-dgreen px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-dgreen/80 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create GRN"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NumberField({ label, value, onChange, step = "1" }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        required
      />
    </div>
  );
}
