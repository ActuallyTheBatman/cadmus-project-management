const nodemailer = require("nodemailer");

const ALLOWED_ORIGIN = "https://cadmusprojects.com";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const { name, email, organization, message, _gotcha } = body;

  // Honeypot: bots fill every field, including this hidden one. Pretend success, drop silently.
  if (_gotcha) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !email || !message) {
    res.status(400).json({ ok: false, error: "Missing required fields" });
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    res.status(400).json({ ok: false, error: "Invalid email" });
    return;
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    res.status(500).json({ ok: false, error: "Mail transport not configured" });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Cadmus Site" <${process.env.GMAIL_USER}>`,
      to: "Garrett@cadmusprojects.com",
      replyTo: email,
      subject: "New inquiry from cadmusprojects.com",
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${organization || "-"}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to send contact email:", err);
    res.status(500).json({ ok: false, error: "Failed to send" });
  }
};
