const {
  UnauthorizedError,
  BadRequestError,
} = require("../../../infrastructure/errors/AppError");
const { generateToken } = require("../../../infrastructure/security/jwtUtils");

class User {
  constructor({
    id,
    email,
    password,
    role,
    status,
    isVerified,
    verificationToken,
    verificationTokenExpiresAt,
    passwordResetToken,
    passwordResetTokenExpiresAt,
  }) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.role = role || "user";
    this.status = status || "pending";
    this.isVerified = isVerified || false;
    this.verificationToken = verificationToken;
    this.verificationTokenExpiresAt = verificationTokenExpiresAt;
    this.passwordResetToken = passwordResetToken;
    this.passwordResetTokenExpiresAt = passwordResetTokenExpiresAt;
  }

  // Changing Role Safely
  changeRole(newRole) {
    const validRoles = ["user", "expert", "admin"];
    if (!validRoles.includes(newRole)) {
      throw new UnauthorizedError("Invalid Role");
    }
    this.role = newRole;
  }

  // Verifying Admin
  isAdmin() {
    return this.role === "admin";
  }

  // User Status
  isBlocked() {
    return this.status === "blocked";
  }

  block(reason = null) {
    this.status = "blocked";
    this.blockedReason = reason;
    this.blockedAt = new Date();
  }

  unblock() {
    this.status = "active";
    this.blockedReason = null;
    this.blockedAt = null;
  }

  // Verifying Expert
  isExpert() {
    return this.role === "expert";
  }

  // Email Verification
  verify(token) {
    if (this.verificationToken !== token) {
      throw new BadRequestError("Invalid token");
    }
    if (
      this.verificationTokenExpiresAt &&
      this.verificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestError("Token has expired");
    }
    this.isVerified = true;
    this.status = "active";
    this.verificationToken = null;
    this.verificationTokenExpiresAt = null;
  }

  // Email Verification Status
  isEmailVerified() {
    return this.isVerified;
  }

  // Resend Verification Email
  resendVerificationEmail() {
    if (this.isVerified) {
      throw new BadRequestError("Email already verified");
    }
    // Generate New Token
    const token = generateToken({ email: this.email }, "1h");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

    // Save New Token Details
    this.verificationToken = token;
    this.verificationTokenExpiresAt = expiresAt;
  }

  // Forget Password Token
  requestPasswordReset() {
    const token = generateToken({ email: this.email }, "1h");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
    this.passwordResetToken = token;
    this.passwordResetTokenExpiresAt = expiresAt;
  }

  // Reset Password
  resetPassword(token, newHashedPassword) {
    if (this.passwordResetToken !== token) {
      throw new BadRequestError("Invalid password reset token");
    }
    if (
      this.passwordResetTokenExpiresAt &&
      this.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestError("Password reset token has expired");
    }

    this.password = newHashedPassword;
    this.passwordResetToken = null;
    this.passwordResetTokenExpiresAt = null;
  }
}

module.exports = User;
