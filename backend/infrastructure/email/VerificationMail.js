const sendEmailFromTemplate = require("./SendEmail");

const sendVerificationEmail = async (email, token) => {
  const verifyLink = `${
    process.env.APP_URI
  }/auth/verify-email?token=${encodeURIComponent(token)}`;

  try {
    const info = await sendEmailFromTemplate({
      to: email,
      subject: "Verify your email",
      templateName: "verify-email.html",
      variables: {
        USER_EMAIL: email,
        ACTION_LINK: verifyLink,
        EXPIRY_TIME: "1 hour",
      },
    });
  } catch (err) {
    throw new Error("Failed to send verification email");
  }
};

module.exports = sendVerificationEmail;
