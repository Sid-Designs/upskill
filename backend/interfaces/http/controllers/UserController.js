const RegisterUser = require("../../../application/use-cases/RegisterUser");

const register = async (req, res) => {
  const registerUser = new RegisterUser();
  const user = await registerUser.execute({
    email: req.body.email,
    password: req.body.password,
    role: "user",
  });
  res.status(201).json(user);
};

const registerAdmin = async (req, res) => {
  const registerUser = new RegisterUser(req.user);
  const user = await registerUser.execute(req.body);
  res.status(201).json(user);
};


module.exports = { register, registerAdmin };
