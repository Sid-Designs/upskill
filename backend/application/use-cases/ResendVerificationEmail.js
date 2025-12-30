const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const VerificationMail = require("../../infrastructure/email/VerificationMail");

class ResendVerificationEmail {
  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async execute(email) {
    if (!email) return;

    // Find User
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;

    if (user.isBlocked()) return;

    // Resend Verification Email
    user.resendVerificationEmail();
    await VerificationMail(user.email, user.verificationToken);

    await this.userRepository.save(user);

    return {
      success: true,
      message:
        "If the email is registered, a verification email has been resent.",
    };
  }
}

module.exports = ResendVerificationEmail;
