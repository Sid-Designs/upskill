const UserRepositoryImpl = require("../../infrastructure/repositories/UserRepositoryImpl");
const sendResetPasswordEmail = require("../../infrastructure/email/ResetPasswordMail");

class RequestPasswordReset {
  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async execute(email) {
    if (!email) return;

    const user = await this.userRepository.findByEmail(email);
    if (!user) return;

    if (user.isBlocked()) return;

    user.requestPasswordReset();

    await this.userRepository.save(user);

    await sendResetPasswordEmail(user.email, user.passwordResetToken);

    return {
      success: true,
      message:
        "If the email is registered, a password reset link has been sent.",
    };
  }
}

module.exports = RequestPasswordReset;
