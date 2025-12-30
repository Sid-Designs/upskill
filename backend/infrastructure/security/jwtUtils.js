const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Generate a JWT for a user
 * @param {Object} payload - user data (e.g., { id, email, role })
 * @returns {string} signed JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT and return decoded payload
 * @param {string} token - JWT string
 * @returns {Object|null} decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null; // invalid or expired token
  }
}

/**
 * Decode a JWT without verifying (useful for debugging)
 * @param {string} token - JWT string
 * @returns {Object|null} decoded payload
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
