const ProfileRepositories = require("../../domains/profile/repositories/ProfileRepositories");
const Profile = require("../../domains/profile/entities/Profile");
const ProfileModel = require("../db/models/Profile");

class ProfileRepositoryImpl extends ProfileRepositories {
  // Profile
  async getUserProfile(userId) {
    const doc = await ProfileModel.findOne({ userId }).lean();

    if (!doc) return null;

    return new Profile({
      id: doc._id.toString(),
      userId: doc.userId,
      avatarUrl: doc.avatarUrl,
      username: doc.username,
      credits: doc.credits,
      bio: doc.bio,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  // Create/Update Profile

  async updateUserProfile(userId, profileData) {
    const updatePayload = {
      ...profileData,
      updatedAt: new Date(),
    };

    Object.keys(updatePayload).forEach(
      (key) => updatePayload[key] === undefined && delete updatePayload[key]
    );

    const doc = await ProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: updatePayload,
        $setOnInsert: {
          userId,
          credits: profileData.credits ?? 0,
          createdAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    return new Profile({
      id: doc._id.toString(),
      userId: doc.userId,
      avatarUrl: doc.avatarUrl,
      username: doc.username,
      credits: doc.credits,
      bio: doc.bio,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async deductCredits(userId, amount) {
    const updated = await ProfileModel.findOneAndUpdate(
      {
        userId,
        credits: { $gte: amount }, 
      },
      {
        $inc: { credits: -amount },
      },
      { new: true }
    );

    return updated; 
  }

  // Delete Profile
  async deleteUserProfile(userId) {
    await ProfileModel.deleteOne({ userId });
    return true;
  }
}

module.exports = ProfileRepositoryImpl;
