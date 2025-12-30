const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const bcrypt = require("bcryptjs");

class ResetPassword {
  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async execute(token, newPassword) {
    if (!token) throw new Error("Token missing");

    if (user.isBlocked()) {
      throw new Error("Account is blocked");
    }

    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user)
      throw new Error("Invalid or expired token");

    const pepper = process.env.PEPPER;
    const newHashedPassword = await bcrypt.hash(newPassword + pepper, 10);

    user.resetPassword(token, newHashedPassword);
    await this.userRepository.save(user);
    return { success: true, message: "Password has been reset successfully" };
  }
}

module.exports = ResetPassword;
