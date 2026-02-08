// Loading Enviornment
const dotenv = require("dotenv");
dotenv.config();

// Packages
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const connectDB = require("./infrastructure/db/mongoose");
const inngestHandler = require("./infrastructure/inngest/handler");
let inngestStarted = false;

// App
const app = express();

// DataBase
connectDB();

// Middleware
app.set('trust proxy', 1);
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "https://upskill-frontend.vercel.app", 
      "https://apiupskill.vercel.app",
      "https://upskill.siddheshdev.com",
      "https://upskillai.vercel.app"
    ],
    credentials: true, 
  })
);

/**
 * IMPORTANT: Razorpay Webhook Raw Body Parser
 * 
 * The webhook route needs the raw body (as string) for signature verification.
 * This middleware must come BEFORE express.json() to capture the raw body.
 * 
 * It adds req.rawBody containing the raw string body for /api/payment/webhook
 */
app.use("/api/payment/webhook", express.json({
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    req.rawBody = buf.toString();
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan("dev", {
    skip: (req) => req.originalUrl.startsWith("/api/inngest"),
  })
);

// Inngest Server
app.use(
  "/api/inngest",
  (req, res, next) => {
    if (!inngestStarted) {
      console.log("✅ Inngest server is started");
      inngestStarted = true;
    }
    next();
  },
  inngestHandler
);

// Routes
const userRoutes = require("./interfaces/http/routes/userRoutes");
const authRoutes = require("./interfaces/http/routes/authRoutes");
const chatRoutes = require("./interfaces/http/routes/chatRoutes");
const profileRoutes = require("./interfaces/http/routes/profileRoutes");
const chatStreamRoutes = require("./interfaces/http/routes/chatStreamRoutes");
const coverLetterStreamRoutes = require("./interfaces/http/routes/coverLetterStreamRoutes");
const paymentRoutes = require("./interfaces/http/routes/paymentRoutes");
const roadmapRoutes = require("./interfaces/http/routes/roadmapRoutes");
const roadmapStreamRoutes = require("./interfaces/http/routes/roadmapStreamRoutes");

app.use("/api/user", userRoutes);
app.use("/api/user", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use(chatStreamRoutes);
app.use(coverLetterStreamRoutes);
app.use(roadmapStreamRoutes);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  if (statusCode === 500) {
    console.error("[Error]", err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && statusCode === 500 && { stack: err.stack }),
  });
});

// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Server is started on ${PORT}`);
});

// API Home Page
app.get("/", (req, res) => {
  res.send("UpSkill AI Powered Career Assistant Backend Page");
});
