const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const User = require("../../domains/user/entities/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../../infrastructure/security/jwtUtils");
const VerificationMail = require("../../infrastructure/email/VerificationMail");
const ProfileRepositoryImpl = require("../../infrastructure/repositories/ProfileRepositoryImpl");

class RegisterUser {
  constructor(currentUser) {
    this.userRepository = new UserRepositoryImpl();
    this.profileRepository = new ProfileRepositoryImpl();
    this.currentUser = currentUser;
  }

  async execute({ email, password, role }) {
    // Check existing user
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new Error("User already exists");

    // Role restriction
    if (role === "admin" && this.currentUser?.role !== "admin") {
      throw new Error("Only admins can register admin users");
    }

    // Hash password + pepper
    const pepper = process.env.PEPPER;
    const hashedPassword = await bcrypt.hash(password + pepper, 10);

    // Email verification token
    const token = generateToken({ email }, "1h");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await VerificationMail(email, token);

    // Create user entity
    const userEntity = new User({
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
    });

    const savedUser = await this.userRepository.save(userEntity);

    // Create profile with default 25 credits
    try {
      await this.profileRepository.updateUserProfile(savedUser.id, {
        username: email.split("@")[0], // default username
        credits: 25,
      });

    } catch (err) {
      console.error("Profile creation failed:", err);
    }

    return savedUser;
  }
}

module.exports = RegisterUser;
