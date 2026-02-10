const mongoose = require("mongoose");
const ProfileRepositories = require("../../domains/profile/repositories/ProfileRepositories");
const Profile = require("../../domains/profile/entities/Profile");
const ProfileModel = require("../db/models/Profile");

class ProfileRepositoryImpl extends ProfileRepositories {
  // Get User Profile
  async getUserProfile(userId) {
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const doc = await ProfileModel.findOne({ userId: objectUserId }).lean();

    if (!doc) return null;

    return new Profile({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      avatarUrl: doc.avatarUrl,
      username: doc.username,
      credits: doc.credits,
      bio: doc.bio,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  // Create / Update Profile (UPSERT)

  async updateUserProfile(userId, profileData) {
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const { credits, ...rest } = profileData;

    const updatePayload = {
      ...rest,
      updatedAt: new Date(),
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const doc = await ProfileModel.findOneAndUpdate(
      { userId: objectUserId },
      {
        $set: updatePayload,
        $setOnInsert: {
          userId: objectUserId,
          credits: credits ?? 0,
          createdAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    // Defensive guard
    if (!doc || !doc.userId) {
      throw new Error("Profile upsert failed: Missing userId");
    }

    // Map DB → Domain Entity
    return new Profile({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      avatarUrl: doc.avatarUrl,
      username: doc.username,
      credits: doc.credits,
      bio: doc.bio,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  // Deduct Credits (Usage / AI / Features)
  async deductCredits(userId, amount) {
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const updated = await ProfileModel.findOneAndUpdate(
      {
        userId: objectUserId,
        credits: { $gte: amount },
      },
      {
        $inc: { credits: -amount },
      },
      { new: true }
    ).lean();

    return updated;
  }


  // Add Credits (Payments / Admin Grants)
  async addCredits(userId, amount) {
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const updated = await ProfileModel.findOneAndUpdate(
      { userId: objectUserId },
      { $inc: { credits: amount } },
      { new: true }
    ).lean();

    return updated;
  }

  // Delete Profile
  async deleteUserProfile(userId) {
    const objectUserId = new mongoose.Types.ObjectId(userId);

    await ProfileModel.deleteOne({ userId: objectUserId });
    return true;
  }
}

module.exports = ProfileRepositoryImpl;
