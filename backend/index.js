import "./loadEnv.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import riderRouter from "./routes/riderRouter.js";
import supplierRouter from "./routes/supplierRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import deliveryRouter from "./routes/deliveryRouter.js";
import faqRouter from "./routes/faqRouter.js";
import orderRouter from "./routes/orderRouter.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import trackingRouter from "./routes/tracking.js";
import paymentRouter from "./routes/paymentRouter.js";
import chatRouter from "./routes/chatRouter.js";
import { connectToMongo } from "./utils/mongoConnection.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTENDURL,
  process.env.BACKENDURL,                                // backend's own origin (production)
  "https://mihisara-grocery-ecommerce.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",                               // rider tracker page is served from here
  "http://127.0.0.1:5000",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow Postman and server-to-server requests with no Origin header
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// CORS must be before all routes
app.use(cors(corsOptions));

app.use(bodyParser.json());

app.use((req, res, next) => {
  const tokenString = req.header("Authorization");

  if (!tokenString) {
    next();
    return;
  }

  const token = tokenString.replace("Bearer ", "");

  jwt.verify(token, process.env.JWTKEY, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }

    req.user = decoded;
    next();
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mihisara Grocery backend is running successfully",
  });
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/riders", riderRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/faqs", faqRouter);
app.use("/api/orders", orderRouter);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tracking", trackingRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/chat", chatRouter);

const PORT = process.env.PORT || 5000;

connectToMongo(mongoose, process.env.MONGODB_URL, {
  serverSelectionTimeoutMS: 15000,
})
  .then(({ usedDirectFallback }) => {
    if (usedDirectFallback) {
      console.warn(
        "MongoDB connected with a direct host fallback after the SRV lookup failed.",
      );
    }

    console.log(
      `Connected to the ${mongoose.connection.db.databaseName} database`,
    );

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    console.log("Database connection failed");
    process.exit(1);
  });