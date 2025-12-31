const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const bcrypt = require("bcryptjs");

class ResetPassword {
  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async execute(token, newPassword) {
    if (!token) throw new Error("Token missing");
    if (!newPassword) throw new Error("New password missing");

    // ✅ FIRST: fetch user
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new Error("Invalid or expired token");
    }

    // ✅ THEN: check blocked status
    if (user.isBlocked && user.isBlocked()) {
      throw new Error("Account is blocked");
    }

    const pepper = process.env.PEPPER;
    const newHashedPassword = await bcrypt.hash(newPassword + pepper, 10);

    // ✅ Reset password
    user.resetPassword(token, newHashedPassword);

    await this.userRepository.save(user);

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  }
}

module.exports = ResetPassword;
