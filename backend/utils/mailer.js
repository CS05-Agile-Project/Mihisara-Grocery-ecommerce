import nodemailer from "nodemailer";

const buildTransporter = () => {
  const user = process.env.MAIL_USER?.trim();
  const pass = process.env.MAIL_PASS?.trim();

  if (!user || !pass) {
    throw new Error("Email is not configured. Set MAIL_USER and MAIL_PASS in backend/.env.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

const stripHtml = (html = "") =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_USER?.trim();
  const transporter = buildTransporter();

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text || stripHtml(html),
  });
}
