class DeleteCoverLetter {
  constructor({ coverLetterRepository }) {
    this.coverLetterRepository = coverLetterRepository;
  }

  async execute({ userId, coverLetterId }) {
    if (!userId) {
      throw new Error("DeleteCoverLetter: userId is required");
    }

    if (!coverLetterId) {
      throw new Error("DeleteCoverLetter: coverLetterId is required");
    }

    // 1️⃣ Fetch cover letter
    const coverLetter = await this.coverLetterRepository.findById(coverLetterId);

    if (!coverLetter) {
      throw new Error("CoverLetter not found");
    }

    // 2️⃣ Ownership check
    if (String(coverLetter.userId) !== String(userId)) {
      throw new Error("Unauthorized access to cover letter");
    }

    // 3️⃣ Hard delete
    await this.coverLetterRepository.deleteById(coverLetterId);

    return { success: true };
  }
}

module.exports = DeleteCoverLetter;
