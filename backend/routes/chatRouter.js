import express from "express";
import { sendChatMessage } from "../controllers/chatController.js";

const chatRouter = express.Router();
const requestBuckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

function chatRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const bucket = requestBuckets.get(key);

  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    requestBuckets.set(key, { count: 1, startedAt: now });
    next();
    return;
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      message: "Too many messages. Please wait a moment and try again.",
    });
    return;
  }

  bucket.count += 1;
  next();
}

chatRouter.post("/", chatRateLimit, sendChatMessage);

export default chatRouter;
