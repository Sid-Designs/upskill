const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  // 🔑 READ TOKEN FROM COOKIE (NOT HEADER)
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // ✅ Normalize user identity
    req.user = {
      id: decoded.id || decoded.userId || decoded._id,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status,
    };

    if (!req.user.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    next();
  });
}

module.exports = authenticateJWT;
