class UserRepository {
  async findByEmail(email) {
    throw new Error("Not implemented");
  }

  async findByPasswordResetToken(token) {
    throw new Error("Not implemented");
  }

  async save(userEntity) {
    throw new Error("Not implemented");
  }
}

module.exports = UserRepository;
