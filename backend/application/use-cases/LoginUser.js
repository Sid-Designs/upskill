const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../../infrastructure/security/jwtUtils");

class LoginUser {
  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async execute({ email, password }) {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    // Check if user is blocked
    if (user.status === "blocked") {
      throw new Error("User account is blocked");
    }

    // Add pepper before comparing
    const pepper = process.env.PEPPER;
    const saltedInput = password + pepper;

    const isMatch = await bcrypt.compare(saltedInput, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    // Generate JWT with user payload
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    return { token, user };
  }
}

module.exports = LoginUser;
