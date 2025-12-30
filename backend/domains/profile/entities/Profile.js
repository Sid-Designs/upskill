class Profile {
  constructor({
    id,
    userId,
    avatarUrl,
    username,
    credits = 0,
    bio = "",
    preferences = {},
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    if (!userId) {
      throw new Error("Profile must have a userId");
    }

    this.id = id;
    this.userId = userId;
    this.avatarUrl = avatarUrl;
    this.username = username?.trim();
    this.credits = Number(credits) || 0;
    this.bio = bio;
    this.preferences = preferences;

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  setUsername(name) {
    if (!name) return;
    this.username = name.trim();
    this.updatedAt = new Date();
  }

  setAvatarUrl(url) {
    if (!url) return;
    this.avatarUrl = url;
    this.updatedAt = new Date();
  }

  updateBio(newBio) {
    if (newBio === undefined) return;
    this.bio = newBio.trim();
    this.updatedAt = new Date();
  }

  updatePreferences(newPreferences) {
    if (!newPreferences || typeof newPreferences !== "object") return;
    this.preferences = { ...this.preferences, ...newPreferences };
    this.updatedAt = new Date();
  }

  addCredits(amt) {
    if (amt <= 0) {
      throw new Error("Amount must be positive.");
    }

    this.credits += amt;
    this.updatedAt = new Date();
  }

  deductCredits(amt) {
    if (amt <= 0) {
      throw new Error("Amount must be positive.");
    }

    if (this.credits < amt) {
      throw new Error("Insufficient Credits");
    }

    this.credits -= amt;
    this.updatedAt = new Date();
  }
}

module.exports = Profile;
