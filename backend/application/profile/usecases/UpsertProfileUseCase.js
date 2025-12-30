class UpsertProfileUseCase {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(userId, payload) {
    if (!userId) {
      throw new Error("userId is required to update profile");
    }

    if (!payload || typeof payload !== "object") {
      throw new Error("Profile update payload is invalid");
    }

    const allowedFields = ["username", "bio", "preferences", "avatarUrl"];

    const updateData = {};

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updateData[field] = payload[field];
      }
    }

    const updatedProfile = await this.profileRepository.updateUserProfile(
      userId,
      updateData
    );

    return updatedProfile;
  }
}

module.exports = UpsertProfileUseCase;
