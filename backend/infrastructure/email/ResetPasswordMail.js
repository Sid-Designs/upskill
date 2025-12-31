const transporter = require("../mailer/transporter");
const sendEmailFromTemplate = require("./SendEmail");

const sendResetPasswordEmail = async (email, token) => {
  const resetLink = `${process.env.APP_URI}/auth/reset-password?token=${token}`;

  try {
    await sendEmailFromTemplate({
      to: email,
      subject: "Reset your password",
      templateName: "resetPasswordEmail.html",
      variables: {
        USER_EMAIL: email,
        ACTION_LINK: resetLink,
        EXPIRY_TIME: "1 hour",
      },
    });
  } catch (err) {
    console.error("Reset password email failed:", err.message);
  }
};

module.exports = sendResetPasswordEmail;