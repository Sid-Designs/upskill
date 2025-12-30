const rateLimit = require("express-rate-limit");

const rateLimiter = ({ windowMs, max }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many requests. Please try again later.",
    },
  });

module.exports = rateLimiter;
