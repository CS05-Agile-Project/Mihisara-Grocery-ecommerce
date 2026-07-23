import Supplier from "../models/supplier.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";
import { sendMail as sendGmail } from "../utils/mailer.js";

export async function sendMail({ to, subject, html }) {
  return sendGmail({ to, subject, html });
}

async function getNextSupplierRecordId() {
  const lastSupplier = await Supplier.findOne({ supplierId: /^BYNSP\d+$/ })
    .sort({ supplierId: -1 })
    .select("supplierId");
  const lastNumber = lastSupplier?.supplierId
    ? parseInt(lastSupplier.supplierId.replace("BYNSP", ""), 10)
    : 0;
  return "BYNSP" + String(lastNumber + 1).padStart(5, "0");
}

async function getNextGrnId() {
  const lastGrn = await Supplier.findOne({ grnId: /^GRN\d+$/ })
    .sort({ grnId: -1 })
    .select("grnId");
  const lastNumber = lastGrn?.grnId
    ? parseInt(lastGrn.grnId.replace("GRN", ""), 10)
    : 0;
  return "GRN" + String(lastNumber + 1).padStart(5, "0");
}


// ✅ Add Supplier
export async function addSupplier(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to add suppliers" });
  }

  try {
    const { email, Name, contactNo } = req.body;

    if (!email || !Name) {
      return res.status(400).json({
        message: "Supplier name and email are required",
      });
    }

    const existing = await Supplier.findOne({
      recordType: "supplier",
      email: String(email).trim().toLowerCase(),
    });
    if (existing) {
      return res.status(400).json({ message: "Supplier email already exists" });
    }

    const phone = String(req.body.contactNo || "").trim();
    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    const newsupplierId = await getNextSupplierRecordId();
    const supplier = new Supplier({
      recordType: "supplier",
      supplierId: newsupplierId,
      email: String(email).trim().toLowerCase(),
      Name: String(Name).trim(),
      contactNo: phone,
    });

    await supplier.save();
    res.json({
      message: "Supplier added successfully",
      supplier,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add supplier", error: err.message });
  }
}

// ✅ Get All Suppliers
export async function createSupplierGrn(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to create supplier GRNs" });
  }

  try {
    const { supplierId, items } = req.body;
    if (!supplierId) {
      return res.status(400).json({ message: "Supplier is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Please add at least one product" });
    }

    const supplier = await Supplier.findOne({
      supplierId,
      recordType: "supplier",
    });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const normalizedItems = items.map((item) => ({
      productId: String(item.productId || "").trim(),
      stock: Number(item.stock) || 0,
      cost: Number(item.cost) || 0,
    }));

    for (const item of normalizedItems) {
      if (!item.productId || item.stock <= 0 || item.cost < 0) {
        return res.status(400).json({
          message: "Each product needs a product, stock greater than 0, and valid cost",
        });
      }
    }

    const productIds = normalizedItems.map((item) => item.productId);
    const products = await Product.find({ productId: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product.productId, product]));
    const missing = productIds.filter((productId) => !productMap.has(productId));

    if (missing.length > 0) {
      return res.status(404).json({
        message: `Product not found: ${missing.join(", ")}`,
      });
    }

    const grnId = await getNextGrnId();
    const grnRows = [];

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);
      product.stock = (Number(product.stock) || 0) + item.stock;
      await product.save();

      grnRows.push(
        await Supplier.create({
          recordType: "grn",
          supplierId: await getNextSupplierRecordId(),
          supplierRefId: supplier.supplierId,
          grnId,
          productId: item.productId,
          email: supplier.email,
          Name: supplier.Name,
          stock: item.stock,
          cost: item.cost,
          contactNo: supplier.contactNo,
        })
      );
    }

    return res.json({
      message: "GRN created and inventory updated",
      grnId,
      items: grnRows,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to create GRN", error: err.message });
  }
}

export async function getSuppliers(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view suppliers" });
  }

  try {
    const suppliers = await Supplier.find().sort({ date: -1 });
    res.json(suppliers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch suppliers", error: err.message });
  }
}

// ✅ Update Supplier
export async function updateSupplier(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to update suppliers" });
  }

  try {
    const supplierId = req.params.supplierId;

    const currentSupplier = await Supplier.findOne({ supplierId });
    if (!currentSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const updatedData = { ...req.body };
    if (req.body.stock !== undefined) updatedData.stock = Number(req.body.stock);
    if (req.body.cost !== undefined) updatedData.cost = Number(req.body.cost);

    await Supplier.updateOne({ supplierId }, updatedData);

    if (currentSupplier.recordType === "supplier") {
      const grnDisplayUpdates = {};
      if (req.body.Name !== undefined) grnDisplayUpdates.Name = req.body.Name;
      if (req.body.email !== undefined) grnDisplayUpdates.email = req.body.email;
      if (req.body.contactNo !== undefined) grnDisplayUpdates.contactNo = req.body.contactNo;

      if (Object.keys(grnDisplayUpdates).length > 0) {
        await Supplier.updateMany(
          { supplierRefId: supplierId, recordType: "grn" },
          { $set: grnDisplayUpdates }
        );
      }
    }

    res.json({ message: "Supplier updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update supplier", error: err.message });
  }
}

// ✅ Delete Supplier
export async function deleteSupplier(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to delete suppliers" });
  }

  try {
    const supplierId = req.params.supplierId;
    await Supplier.deleteOne({ supplierId });

    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete supplier", error: err.message });
  }
}

// ✅ Notify Supplier via Email
export async function notifySupplier(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to notify suppliers" });
  }

  try {
    const { productId } = req.body;

    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const latestSupply = await Supplier.findOne({ productId, recordType: "grn" })
      .sort({ date: -1 })
      .lean();
    if (!latestSupply) {
      return res
        .status(404)
        .json({ message: "No GRN supplier linked to this product" });
    }

    const supplierProfile = latestSupply.supplierRefId
      ? await Supplier.findOne({
          supplierId: latestSupply.supplierRefId,
          recordType: "supplier",
        }).lean()
      : null;
    const supplier = supplierProfile || latestSupply;

    if (!supplier?.email) {
      return res.status(404).json({
        message: "Supplier email is missing for this product",
      });
    }

    const msg = `
  <div style="
    font-family: 'Segoe UI', Roboto, sans-serif;
    background-color: #f8fafc;
    padding: 20px;
    border-radius: 10px;
    color: #333;
    max-width: 600px;
    margin: auto;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  ">
   
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #059669; margin: 0;">Mihisara Grocery Inventory Alert</h2>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Automated Supplier Notification</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
    </div>

   
    <p>Dear <strong>${supplier.Name}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6;">
      This is an automated notice from the <b>Mihisara Grocery Inventory System</b>.
      The following product has reached a low stock level:
    </p>

   
    <div style="
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 6px;
    ">
      <p style="margin: 4px 0;"><b>Product Name:</b> ${product.name}</p>
      <p style="margin: 4px 0;"><b>Product ID:</b> ${product.productId}</p>
      <p style="margin: 4px 0; color: #b91c1c;"><b>Current Stock:</b> ${product.stock}</p>
      <p style="margin: 4px 0;"><b>Last Supplier:</b> ${supplier.Name}</p>
      <p style="margin: 4px 0;"><b>Last GRN:</b> ${latestSupply.grnId || "-"}</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">
      Please arrange a <b>resupply</b> at the earliest convenience to avoid stock-out situations.
      Timely restocking helps ensure uninterrupted order fulfillment and smooth operations.
    </p>

  
    <div style="margin-top: 24px; text-align: center; font-size: 13px; color: #64748b;">
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 12px;" />
      <p style="margin: 0;">Thank you,</p>
      <p style="font-weight: 600; color: #059669; margin: 4px 0;">Mihisara Grocery Inventory Management System</p>
      <p style="margin: 0;">Efficient. Reliable. Connected.</p>
    </div>
  </div>
`;


    await sendMail({
      to: supplier.email,
      subject: `Resupply Request: ${product.name}`,
      html: msg,
    });

    res.json({
      message: "Email sent to supplier successfully",
      supplier: {
        supplierId: supplier.supplierId,
        Name: supplier.Name,
        email: supplier.email,
      },
      grnId: latestSupply.grnId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to notify supplier", error: err.message });
  }
}
