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

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.FRONTENDURL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

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

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
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

const PORT = 5000;

mongoose
  .connect(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log(
      `Connected to the ${mongoose.connection.db.databaseName} database`,
    );
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    console.log("Database connection failed");
    process.exit(1);
  });
