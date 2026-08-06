import nodemailer from "nodemailer";

const buildTransporter = () => {
  const user = process.env.MAIL_USER?.trim();
  let pass = process.env.MAIL_PASS?.trim();

  if (pass) {
    // Strip spaces from Google App Password (e.g., "xxxx xxxx xxxx xxxx" -> "xxxxxxxxxxxxxxxx")
    pass = pass.replace(/\s+/g, "");
  }

  if (!user || !pass) {
    throw new Error("Email is not configured. Please set MAIL_USER and MAIL_PASS in backend environment variables.");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

const stripHtml = (html = "") =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function sendMail({ to, subject, html, text }) {
  const user = process.env.MAIL_USER?.trim();
  const transporter = buildTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"Mihisara Grocery" <${user}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });
    console.log("Email sent successfully to:", to, "Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email to:", to, "Error:", error);
    throw error;
  }
}

