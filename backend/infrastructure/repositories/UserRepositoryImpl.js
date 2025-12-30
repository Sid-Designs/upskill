const UserRepository = require("../../domains/user/repositories/UserRepositories");
const UserModel = require("../db/models/User");
const User = require("../../domains/user/entities/User");

class UserRepositoryImpl extends UserRepository {
  mapToEntity(userDoc) {
    return new User({
      id: userDoc._id.toString(),        
      email: userDoc.email,
      password: userDoc.password,
      role: userDoc.role,
      status: userDoc.status,
      isVerified: userDoc.isVerified,
      verificationToken: userDoc.verificationToken,
      verificationTokenExpiresAt: userDoc.verificationTokenExpiresAt,
      passwordResetToken: userDoc.passwordResetToken,
      passwordResetTokenExpiresAt: userDoc.passwordResetTokenExpiresAt,
    });
  }

  async findByEmail(email) {
    const userDoc = await UserModel.findOne({ email });
    if (!userDoc) return null;
    return this.mapToEntity(userDoc);
  }

  async findByPasswordResetToken(token) {
    const userDoc = await UserModel.findOne({ passwordResetToken: token });
    if (!userDoc) return null;
    return this.mapToEntity(userDoc);
  }

  async save(userEntity) {
    let userDoc = await UserModel.findOne({ email: userEntity.email });

    if (!userDoc) {
      userDoc = new UserModel({
        email: userEntity.email,
        password: userEntity.password,
        role: userEntity.role,
        status: userEntity.status,
        isVerified: userEntity.isVerified,
        verificationToken: userEntity.verificationToken,
        verificationTokenExpiresAt: userEntity.verificationTokenExpiresAt,
        passwordResetToken: userEntity.passwordResetToken,
        passwordResetTokenExpiresAt: userEntity.passwordResetTokenExpiresAt,
      });
    } else {
      userDoc.password = userEntity.password;
      userDoc.role = userEntity.role;
      userDoc.status = userEntity.status;
      userDoc.isVerified = userEntity.isVerified;
      userDoc.verificationToken = userEntity.verificationToken;
      userDoc.verificationTokenExpiresAt = userEntity.verificationTokenExpiresAt;
      userDoc.passwordResetToken = userEntity.passwordResetToken;
      userDoc.passwordResetTokenExpiresAt =
        userEntity.passwordResetTokenExpiresAt;
    }

    await userDoc.save();

    return this.mapToEntity(userDoc);
  }
}

module.exports = UserRepositoryImpl;
