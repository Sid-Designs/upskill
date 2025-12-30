class GetProfileUseCase {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(userId) {
    if (!userId) {
      throw new Error("userId is required to get profile");
    }

    const profile = await this.profileRepository.getUserProfile(userId);

    return profile;
  }
}

module.exports = GetProfileUseCase;
