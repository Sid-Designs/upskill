const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    // ✅ Normalize user identity
    req.user = {
      id: decoded.id || decoded.userId || decoded._id,
      email: decoded.email,
      role: decoded.role,
    };

    // ✅ Correct validation
    if (!req.user.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    next();
  });
}

module.exports = authenticateJWT;
