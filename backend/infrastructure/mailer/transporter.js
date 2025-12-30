const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                  // e.g. smtp.gmail.com or your provider
  port: Number(process.env.SMTP_PORT) || 587,  // 465 for SSL, 587 for TLS
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,        // your SMTP username
    pass: process.env.SMTP_PASS         // your SMTP password or app password
  }
});

// Optional: verify connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed: ", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

module.exports = transporter;
