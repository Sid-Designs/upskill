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
      "https://upskill.siddheshdev.com"
    ],
    credentials: true, 
  })
);
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

app.use("/api/user", userRoutes);
app.use("/api/user", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);
app.use(chatStreamRoutes);
app.use(coverLetterStreamRoutes);
app.use((err, req, res, next) => {
  res.json({ error: err.message });
});

// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Server is started on ${PORT}`);
});

// Home Page
app.get("/", (req, res) => {
  res.send("UpSkill AI Powered Career Assistant Backend Page");
});
