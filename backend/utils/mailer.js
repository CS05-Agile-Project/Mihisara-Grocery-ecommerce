import nodemailer from "nodemailer";
import { Resend } from "resend";

// ─────────────────────────────────────────────────────────────────────────────
// Resend (HTTP API) — used in production / Render where SMTP is blocked
// ─────────────────────────────────────────────────────────────────────────────
async function sendWithResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set.");

  const resend = new Resend(apiKey);

  // MAIL_FROM should be something like: Mihisara Grocery <hello@yourdomain.com>
  // If you haven't verified a domain yet, use: onboarding@resend.dev (only sends to your own email)
  const from =
    process.env.MAIL_FROM ||
    `Mihisara Grocery <${process.env.MAIL_USER || "onboarding@resend.dev"}>`;

  const stripHtml = (h = "") =>
    h.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: text || stripHtml(html),
  });

  if (error) throw new Error(error.message || JSON.stringify(error));

  console.log("Email sent via Resend to:", to, "| ID:", data?.id);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Nodemailer (SMTP) — used locally where SMTP is NOT blocked
// ─────────────────────────────────────────────────────────────────────────────
function buildSmtpTransporter() {
  const user = process.env.MAIL_USER?.trim();
  let pass = process.env.MAIL_PASS?.trim();

  if (pass) pass = pass.replace(/\s+/g, ""); // strip spaces from app password

  if (!user || !pass) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY (production) or MAIL_USER + MAIL_PASS (local)."
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });
}

const stripHtml = (html = "") =>
  html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();

async function sendWithSmtp({ to, subject, html, text }) {
  const user = process.env.MAIL_USER?.trim();
  const transporter = buildSmtpTransporter();
  const info = await transporter.sendMail({
    from: `"Mihisara Grocery" <${user}>`,
    to,
    subject,
    html,
    text: text || stripHtml(html),
  });
  console.log("Email sent via SMTP to:", to, "| Message ID:", info.messageId);
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified sendMail — auto-selects Resend or SMTP based on env vars
// ─────────────────────────────────────────────────────────────────────────────
export async function sendMail({ to, subject, html, text }) {
  try {
    if (process.env.RESEND_API_KEY) {
      // Production: use Resend HTTP API (works on Render, Vercel, etc.)
      return await sendWithResend({ to, subject, html, text });
    } else {
      // Local dev: fall back to nodemailer SMTP
      return await sendWithSmtp({ to, subject, html, text });
    }
  } catch (error) {
    console.error("Failed to send email to:", to, "Error:", error);
    throw error;
  }
}
