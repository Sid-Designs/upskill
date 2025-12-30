const LoginUser = require("../../../application/use-cases/LoginUser");
const VerifyUser = require("../../../application/use-cases/VerifyUser");
const ResendVerificationEmail = require("../../../application/use-cases/ResendVerificationEmail");
const RequestPasswordReset = require("../../../application/use-cases/RequestPasswordReset");
const ResetPassword = require("../../../application/use-cases/ResetPassword");

const login = async (req, res) => {
  const loginUser = new LoginUser();
  const { token, user } = await loginUser.execute(req.body);
  res.json({ token, user });
};

const verifyEmail = async (req, res) => {
  const verifyUser = new VerifyUser();
  const result = await verifyUser.execute(req.query.token);
  res.json(result);
};

const resendVerification = async (req, res) => {
  const resendEmail = new ResendVerificationEmail();
  const result = await resendEmail.execute(req.body.email);
  res.json(result);
};

const requestPasswordReset = async (req, res) => {
  const requestReset = new RequestPasswordReset();
  const result = await requestReset.execute(req.body.email);
  res.json(result);
};

const resetPassword = async (req, res) => {
  const resetPasswordUseCase = new ResetPassword();
  const result = await resetPasswordUseCase.execute(
    req.body.token,
    req.body.newPassword
  );
  res.json(result);
};

module.exports = { login, verifyEmail, resendVerification, requestPasswordReset, resetPassword };
