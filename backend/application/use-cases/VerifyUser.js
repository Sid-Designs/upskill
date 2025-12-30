const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const { verifyToken } = require("../../infrastructure/security/jwtUtils");

class VerifyUser {
  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async execute(token) {
    if (!token) throw new Error("Token missing");

    const decoded = verifyToken(token);
    if (!decoded?.email) throw new Error("Invalid or expired token");

    const user = await this.userRepository.findByEmail(decoded.email);
    if (!user) throw new Error("User not found");

    user.verify(token);

    await this.userRepository.save(user);

    return { success: true, message: "Email verified successfully" };
  }
}

module.exports = VerifyUser;
