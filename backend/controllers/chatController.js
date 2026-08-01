import { GoogleGenAI } from "@google/genai";
import Delivery from "../models/delivery.js";
import Faq from "../models/faq.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import Review from "../models/review.js";
import Rider from "../models/rider.js";
import Supplier from "../models/supplier.js";
import User from "../models/user.js";

const MAX_MESSAGE_LENGTH = 1000;
const INTERACTION_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;
const DELIVERY_FEE_LKR = 350;
const DELIVERY_RADIUS_KM = 5;
const PRODUCT_INTENT_WORDS = [
  "catalog",
  "catalogue",
  "category",
  "categories",
  "price",
  "cost",
  "stock",
  "available",
  "availability",
  "product",
  "products",
  "item",
  "items",
  "sell",
  "have",
];
const ORDER_INTENT_WORDS = [
  "order",
  "orders",
  "delivery",
  "deliveries",
  "track",
  "tracking",
  "payment",
  "paid",
  "pending",
  "completed",
  "cancelled",
];
const ADMIN_INTENT_WORDS = [
  "admin",
  "customer",
  "customers",
  "rider",
  "riders",
  "supplier",
  "suppliers",
  "review",
  "reviews",
  "sales",
  "inventory",
  "dashboard",
  "report",
  "users",
  "order",
  "orders",
  "delivery",
  "deliveries",
  "payment",
  "payments",
  "stock",
  "low",
];
const STOP_WORDS = new Set([
  "a",
  "about",
  "and",
  "are",
  "can",
  "current",
  "details",
  "do",
  "for",
  "give",
  "have",
  "how",
  "i",
  "in",
  "include",
  "is",
  "item",
  "items",
  "like",
  "me",
  "of",
  "please",
  "price",
  "product",
  "products",
  "show",
  "site",
  "stock",
  "tell",
  "the",
  "this",
  "to",
  "what",
  "with",
  "you",
  "your",
]);

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSearchTerms(message) {
  return [
    ...new Set(
      message
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
        .flatMap((word) => {
          if (word.endsWith("ies") && word.length > 4) {
            return [word, `${word.slice(0, -3)}y`];
          }

          if (word.endsWith("es") && word.length > 4) {
            return [word, word.slice(0, -2)];
          }

          if (word.endsWith("s") && word.length > 3) {
            return [word, word.slice(0, -1)];
          }

          return [word];
        })
    ),
  ].slice(0, 8);
}

function hasProductIntent(message) {
  const normalizedMessage = message.toLowerCase();
  const mentionsDeliveryOnly =
    /\b(deliver|delivery|shipping)\b/i.test(normalizedMessage) &&
    !/\b(available|availability|have|item|items|product|products|sell|stock)\b/i.test(
      normalizedMessage
    );

  if (mentionsDeliveryOnly) {
    return false;
  }

  return PRODUCT_INTENT_WORDS.some((word) => normalizedMessage.includes(word));
}

function hasCategoryIntent(message) {
  return /\b(catalog|catalogue|categories|category|types?)\b/i.test(message);
}

function hasAnyIntent(message, words) {
  const normalizedMessage = message.toLowerCase();
  return words.some((word) => normalizedMessage.includes(word));
}

function formatDate(value) {
  if (!value) {
    return "not recorded";
  }

  return new Date(value).toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  });
}

function formatMoney(value) {
  return `LKR ${Number(value || 0).toFixed(2)}`;
}

function buildPublicSystemFacts() {
  return [
    `Home delivery fee: ${formatMoney(DELIVERY_FEE_LKR)}.`,
    `Home delivery is available only within ${DELIVERY_RADIUS_KM} km of the store.`,
    "Store pickup is available.",
    "Cash on delivery is available for home delivery. Card payment is supported.",
    "Customers can browse products, add items to cart, checkout, pay, track delivery, read FAQs, and submit reviews.",
    "Admins manage products, inventory, orders, customers, suppliers, riders, reviews, FAQs, and reports.",
    "Riders view assigned delivery orders and update delivery status.",
  ].join("\n");
}

async function getProductContext(message) {
  if (!hasProductIntent(message)) {
    return "No product database lookup was needed for this question.";
  }

  if (hasCategoryIntent(message)) {
    const categories = await Product.aggregate([
      { $match: { isAvailable: true } },
      { $unwind: "$categories" },
      {
        $group: {
          _id: "$categories",
          productCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (categories.length === 0) {
      return "No available product categories were found in the database.";
    }

    return `Available product categories from the database:\n${categories
      .filter((category) => category._id)
      .map(
        (category, index) =>
          `${index + 1}. ${category._id} (${category.productCount} products)`
      )
      .join("\n")}`;
  }

  const terms = getSearchTerms(message);
  const productProjection = {
    productId: 1,
    name: 1,
    categories: 1,
    description: 1,
    labelledPrice: 1,
    price: 1,
    stock: 1,
    isAvailable: 1,
    _id: 0,
  };

  let products = [];

  if (terms.length > 0) {
    const regexQueries = terms.map((term) => {
      const regex = new RegExp(escapeRegex(term), "i");
      return {
        $or: [
          { productId: regex },
          { name: regex },
          { categories: regex },
          { description: regex },
        ],
      };
    });

    products = await Product.find(
      {
        isAvailable: true,
        $or: regexQueries,
      },
      productProjection
    )
      .sort({ name: 1 })
      .limit(8)
      .lean();
  }

  if (products.length === 0 && terms.length === 0) {
    products = await Product.find({ isAvailable: true }, productProjection)
      .sort({ name: 1 })
      .limit(8)
      .lean();
  }

  if (products.length === 0) {
    return terms.length > 0
      ? `No available products matched these customer search terms: ${terms.join(
          ", "
        )}.`
      : "No available products were found in the database.";
  }

  return products
    .map((product, index) => {
      const stockStatus =
        product.stock > 0 ? `${product.stock} in stock` : "out of stock";
      const categories = product.categories?.length
        ? product.categories.join(", ")
        : "uncategorized";

      return `${index + 1}. ${product.name} (${product.productId}) - Price: LKR ${product.price}; Labelled price: LKR ${product.labelledPrice}; Stock: ${stockStatus}; Categories: ${categories}; Available on site: ${
        product.isAvailable ? "yes" : "no"
      }`;
    })
    .join("\n");
}

async function getStoreOverviewContext() {
  const [
    availableProducts,
    totalProducts,
    categories,
    reviewSummary,
    faqCount,
  ] = await Promise.all([
    Product.countDocuments({ isAvailable: true }),
    Product.countDocuments(),
    Product.distinct("categories", { isAvailable: true }),
    Review.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]),
    Faq.countDocuments(),
  ]);

  const rating = reviewSummary[0]?.averageRating
    ? Number(reviewSummary[0].averageRating).toFixed(1)
    : "not available";
  const reviewCount = reviewSummary[0]?.count || 0;
  const categoryList = categories.filter(Boolean).sort().slice(0, 20);

  return [
    `Available products: ${availableProducts} of ${totalProducts} total products.`,
    `Available categories: ${
      categoryList.length > 0 ? categoryList.join(", ") : "none recorded"
    }.`,
    `Customer reviews: ${reviewCount}; average rating: ${rating}.`,
    `FAQs in system: ${faqCount}.`,
  ].join("\n");
}

async function getReviewContext(message) {
  if (!hasAnyIntent(message, ADMIN_INTENT_WORDS)) {
    return "No review database lookup was needed for this question.";
  }

  const reviews = await Review.find(
    {},
    { reviewId: 1, usersName: 1, comment: 1, rating: 1, _id: 0 }
  )
    .sort({ reviewId: -1 })
    .limit(5)
    .lean();

  if (reviews.length === 0) {
    return "No customer reviews were found in the database.";
  }

  return reviews
    .map(
      (review, index) =>
        `${index + 1}. ${review.usersName || "Customer"} rated ${
          review.rating
        }/5: ${review.comment}`
    )
    .join("\n");
}

async function getOrderContext(message, user) {
  if (!hasAnyIntent(message, ORDER_INTENT_WORDS)) {
    return "No order database lookup was needed for this question.";
  }

  if (!user) {
    return "Order and delivery status require the customer to be logged in.";
  }

  const projection = {
    orderId: 1,
    status: 1,
    deliveryMethod: 1,
    paymentStatus: 1,
    total: 1,
    products: 1,
    date: 1,
    _id: 0,
  };
  const terms = getSearchTerms(message);
  const orderIdTerms = terms.filter((term) => /^byn|^\d+$|ord|order/i.test(term));
  const query =
    user.role === "admin"
      ? orderIdTerms.length > 0
        ? {
            $or: orderIdTerms.map((term) => ({
              orderId: new RegExp(escapeRegex(term), "i"),
            })),
          }
        : {}
      : { email: user.email };

  const orders = await Order.find(query, projection)
    .sort({ date: -1 })
    .limit(user.role === "admin" ? 8 : 5)
    .lean();

  if (orders.length === 0) {
    return user.role === "admin"
      ? "No orders matched this question."
      : "No orders were found for the logged-in customer.";
  }

  return orders
    .map((order, index) => {
      const items = (order.products || [])
        .slice(0, 4)
        .map(
          (item) =>
            `${item.productInfo?.name || item.productInfo?.productId} x${
              item.quantity
            }`
        )
        .join(", ");

      return `${index + 1}. Order ${order.orderId}: status ${
        order.status
      }, ${order.deliveryMethod}, payment ${order.paymentStatus}, total ${formatMoney(
        order.total
      )}, date ${formatDate(order.date)}, items: ${items || "not recorded"}.`;
    })
    .join("\n");
}

async function getDeliveryContext(message, user) {
  if (!hasAnyIntent(message, ORDER_INTENT_WORDS)) {
    return "No delivery database lookup was needed for this question.";
  }

  if (!user) {
    return "Delivery status requires the customer to be logged in.";
  }

  let query = {};

  if (user.role !== "admin") {
    const customerOrders = await Order.find({ email: user.email }, { orderId: 1, _id: 0 })
      .sort({ date: -1 })
      .limit(10)
      .lean();
    query = { orderId: { $in: customerOrders.map((order) => order.orderId) } };
  }

  const deliveries = await Delivery.find(
    query,
    { deliveryId: 1, orderId: 1, riderId: 1, status: 1, date: 1, _id: 0 }
  )
    .sort({ date: -1 })
    .limit(user.role === "admin" ? 8 : 5)
    .lean();

  if (deliveries.length === 0) {
    return user.role === "admin"
      ? "No delivery records were found."
      : "No delivery records were found for the logged-in customer.";
  }

  return deliveries
    .map(
      (delivery, index) =>
        `${index + 1}. Delivery ${delivery.deliveryId} for order ${
          delivery.orderId
        }: status ${delivery.status}, rider ${
          delivery.riderId || "not assigned"
        }, created ${formatDate(delivery.date)}.`
    )
    .join("\n");
}

async function getAdminSystemContext(message, user) {
  if (user?.role !== "admin" || !hasAnyIntent(message, ADMIN_INTENT_WORDS)) {
    return user?.role === "admin"
      ? "No admin database lookup was needed for this question."
      : "Admin-only database details are not available to this visitor.";
  }

  const [userCounts, riders, suppliers, lowStockProducts, orderCounts] =
    await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: "$role",
            total: { $sum: 1 },
            blocked: { $sum: { $cond: ["$isBlocked", 1, 0] } },
          },
        },
      ]),
      Rider.find(
        {},
        { riderId: 1, Name: 1, vehicleType: 1, status: 1, _id: 0 }
      )
        .sort({ riderId: 1 })
        .limit(10)
        .lean(),
      Supplier.find(
        {},
        {
          recordType: 1,
          supplierId: 1,
          supplierRefId: 1,
          grnId: 1,
          productId: 1,
          Name: 1,
          stock: 1,
          cost: 1,
          date: 1,
          _id: 0,
        }
      )
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      Product.find(
        { stock: { $lte: 10 } },
        { productId: 1, name: 1, stock: 1, isAvailable: 1, _id: 0 }
      )
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalSales: { $sum: "$total" },
          },
        },
      ]),
    ]);

  const users = userCounts
    .map((item) => `${item._id || "unknown"}: ${item.total} (${item.blocked} blocked)`)
    .join(", ");
  const riderList =
    riders.length > 0
      ? riders
          .map(
            (rider) =>
              `${rider.riderId} ${rider.Name} (${rider.vehicleType}) - ${
                rider.status ? "available" : "busy/unavailable"
              }`
          )
          .join("; ")
      : "none recorded";
  const supplierList =
    suppliers.length > 0
      ? suppliers
          .map(
            (supplier) =>
              `${supplier.recordType} ${supplier.supplierId}: ${
                supplier.Name
              }, product ${supplier.productId || "not linked"}, stock ${
                supplier.stock ?? 0
              }, cost ${formatMoney(supplier.cost)}`
          )
          .join("; ")
      : "none recorded";
  const lowStockList =
    lowStockProducts.length > 0
      ? lowStockProducts
          .map(
            (product) =>
              `${product.name} (${product.productId}) stock ${product.stock}, available ${
                product.isAvailable ? "yes" : "no"
              }`
          )
          .join("; ")
      : "no products at or below 10 stock";
  const orders = orderCounts
    .map(
      (item) =>
        `${item._id || "unknown"}: ${item.count} orders, ${formatMoney(
          item.totalSales
        )}`
    )
    .join(", ");

  return [
    `Users by role: ${users || "none recorded"}.`,
    `Orders by status: ${orders || "none recorded"}.`,
    `Riders: ${riderList}.`,
    `Recent supplier/GRN records: ${supplierList}.`,
    `Low-stock products: ${lowStockList}.`,
  ].join("\n");
}

async function buildDatabaseContext(message, user) {
  const [
    storeOverview,
    productContext,
    orderContext,
    deliveryContext,
    reviewContext,
    adminContext,
  ] = await Promise.all([
    getStoreOverviewContext(),
    getProductContext(message),
    getOrderContext(message, user),
    getDeliveryContext(message, user),
    getReviewContext(message),
    getAdminSystemContext(message, user),
  ]);

  const viewer = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      user.userId
    : "anonymous visitor";

  return `Viewer: ${viewer}; role: ${user?.role || "guest"}.

Store overview:
${storeOverview}

Product database context:
${productContext}

Order database context:
${orderContext}

Delivery database context:
${deliveryContext}

Review database context:
${reviewContext}

Admin database context:
${adminContext}`;
}

function buildSystemInstruction(faqs, databaseContext) {
  const faqContext =
    faqs.length > 0
      ? faqs
          .map(
            (faq, index) =>
              `${index + 1}. Question: ${faq.question}\nAnswer: ${faq.answer}`
          )
          .join("\n\n")
      : "No store FAQs are currently available.";

  return `You are Mihisara Assistant, the friendly customer-support chatbot for Mihisara Grocery, an online grocery store in Hikkaduwa, Sri Lanka.

Rules:
- Help with shopping, delivery, payments, returns, accounts, and how to use the Mihisara Grocery website.
- Treat the store FAQ content, store facts, and database context below as the source of truth.
- Use exact database product prices, stock, order statuses, delivery statuses, reviews, and admin summaries when they are present in the database context.
- If the customer asks what categories or item types are available, answer using the category list in Product database context or Store overview.
- Customers can only receive their own order and delivery details. Admin-only summaries are only provided when the viewer role is admin.
- Never invent prices, stock availability, order status, policies, discounts, or delivery times.
- If information is not present, say you are not certain and direct the customer to Contact Us or +94 71 755 7972 (8:00 a.m. to 8:00 p.m. daily).
- Never claim that you placed, changed, cancelled, or refunded an order.
- Do not request or reveal passwords, password hashes, OTPs, card details, private location coordinates, tokens, or another customer's personal data.
- Keep answers warm, clear, and concise. Reply in the language used by the customer when possible.

Store facts:
${buildPublicSystemFacts()}

Database context:
${databaseContext}

Store FAQs:
${faqContext}`;
}

export async function sendChatMessage(req, res) {
  const message =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const previousInteractionId =
    typeof req.body?.previousInteractionId === "string"
      ? req.body.previousInteractionId.trim()
      : "";

  if (!message) {
    return res.status(400).json({ message: "Please enter a message." });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      message: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    });
  }

  if (
    previousInteractionId &&
    !INTERACTION_ID_PATTERN.test(previousInteractionId)
  ) {
    return res.status(400).json({ message: "Invalid conversation ID." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      message: "The AI assistant has not been configured yet.",
    });
  }

  try {
    const faqs = await Faq.find({}, { question: 1, answer: 1, _id: 0 })
      .sort({ faqId: 1 })
      .limit(50)
      .lean();
    const databaseContext = await buildDatabaseContext(message, req.user);

    const request = {
      model: process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite",
      input: message,
      system_instruction: buildSystemInstruction(faqs, databaseContext),
      generation_config: {
        temperature: 0.3,
        max_output_tokens: 300,
        thinking_level: "minimal",
      },
    };

    if (previousInteractionId) {
      request.previous_interaction_id = previousInteractionId;
    }

    const interaction = await ai.interactions.create(request);
    const reply = interaction.output_text?.trim();

    if (!reply) {
      return res.status(502).json({
        message: "The assistant could not create a response. Please try again.",
      });
    }

    return res.json({
      reply,
      interactionId: interaction.id,
    });
  } catch (error) {
    console.error("Gemini chat request failed:", error?.message || error);

    const status = error?.status || error?.code;
    if (status === 429) {
      return res.status(429).json({
        message: "The assistant is busy right now. Please try again shortly.",
      });
    }

    if (status === 401 || status === 403) {
      return res.status(503).json({
        message: "The AI assistant configuration needs attention.",
      });
    }

    return res.status(502).json({
      message: "The AI assistant is temporarily unavailable. Please try again.",
    });
  }
}
