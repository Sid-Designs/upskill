const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const User = require("../../domains/user/entities/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../../infrastructure/security/jwtUtils");
const VerificationMail = require("../../infrastructure/email/VerificationMail");

class RegisterUser {
  constructor(currentUser) {
    this.userRepository = new UserRepositoryImpl();
    this.currentUser = currentUser;
  }

  async execute({ email, password, role }) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser)
      throw new Error( "User already exists" );

    // Enforce role restriction
    if (role === "admin" && this.currentUser?.role !== "admin") {
      throw new Error("Only admins can register admin users");
    }

    // Hash password with pepper
    const pepper = process.env.PEPPER;
    const hashedPassword = await bcrypt.hash(password + pepper, 10);

    // Generate verification token
    const token = generateToken({ email }, "1h");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

    // Send verification email
    await VerificationMail(email, token);

    // Only save if email was sent successfully
    const userEntity = new User({
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
    });

    return await this.userRepository.save(userEntity);
  }
}

module.exports = RegisterUser;
