import Product from "../models/product.js";
import { isAdmin } from "./userController.js";
import mongoose from "mongoose";

async function getNextProductId() {
    const lastProduct = await Product.findOne({ productId: /^BYNPD\d+$/ })
        .sort({ productId: -1 })
        .select("productId");
    const lastNumber = lastProduct?.productId
        ? parseInt(lastProduct.productId.replace("BYNPD", ""), 10)
        : 0;
    return "BYNPD" + String(lastNumber + 1).padStart(5, "0");
}

export async function saveProduct(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const newProductId = await getNextProductId();

        const existing = await Product.findOne({ productId: newProductId });
        if (existing) {
            return res.status(400).json({ message: "Generated productId already exists" });
        }


        const product = new Product({
            productId: newProductId, 
            name: req.body.name,
            categories: req.body.categories,
            description: req.body.description,
            images: req.body.images,
            labelledPrice: req.body.labelledPrice,
            price: req.body.price,
            stock: req.body.stock,
            isAvailable: req.body.isAvailable
        });

        await product.save();
        res.json({ message: "Product added successfully", productId: newProductId });

    } catch (err) {
        console.error("Save error:", err);
        res.status(500).json({
            message: "Failed to add product",
            error: err.message
        });
    }
}

export async function getProducts(req, res) {
    try {
        if (isAdmin(req)) {
            const products = await Product.find();
            res.json(products);
        } else {
            const products = await Product.find({ isAvailable: true });
            res.json(products);
        }
    } catch (err) {
        res.json({
            message: "Failed to get products",
            error: err
        });
    }
}

export async function searchProducts(req, res) {
  try {
    const query = req.query.query || "";   // 👈 match frontend
    if (!query) return res.json([]);

    const searchRegex = new RegExp(query, "i");

    const products = isAdmin(req)
      ? await Product.find({ name: searchRegex })
      : await Product.find({ name: searchRegex, isAvailable: true });

    res.json(products);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed", error: err.message });
  }
}

export const getProductById = async (req, res) => {
  try {
    const incomingProductId = req.params.productId;
    const productQuery = [{ productId: incomingProductId }];

    if (mongoose.isValidObjectId(incomingProductId)) {
      productQuery.push({ _id: incomingProductId });
    }

    const product = await Product.findOne({ $or: productQuery });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getProductsByCategory(req, res) {
    try {
        const category = req.body.category;

        if (!category) {
            return res.status(400).json({ message: "Category is required" });
        }
        
       
        let products;
        const query = { categories: { $regex: new RegExp(`^${category}$`, "i") } };

        if (isAdmin(req)) {
            products = await Product.find(query);
        } else {
            products = await Product.find({ ...query, isAvailable: true });
        }

        res.json(products);
    } catch (err) {
        console.error("Category fetch error:", err);
        res.status(500).json({
            message: "Failed to get products by category",
            error: err.message,
        });
    }
}


export async function deleteProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to delete a product"
        });
        return;
    }

    try {
        await Product.deleteOne({ productId: req.params.productId });
        res.json({
            message: "Product deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete product",
            error: err
        });
    }
}

export async function updateProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to update a product"
        });
        return;
    }

    const productId = req.params.productId;
    const updatingData = req.body;

    try {
        await Product.updateOne({ productId }, updatingData);
        res.json({ message: "Product updated successfully" });
    } catch (err) {
        res.status(500).json({
            message: "Internal server error",
            error: err
        });
    }
}
