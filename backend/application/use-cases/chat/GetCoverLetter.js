class GetCoverLetter {
  constructor({ coverLetterRepository }) {
    this.coverLetterRepository = coverLetterRepository;
  }

  async execute({ userId, coverLetterId }) {
    if (!userId) {
      throw new Error("GetCoverLetter: userId is required");
    }

    if (!coverLetterId) {
      throw new Error("GetCoverLetter: coverLetterId is required");
    }

    const coverLetter = await this.coverLetterRepository.findById(coverLetterId);

    if (!coverLetter) {
      throw new Error("CoverLetter not found");
    }

    if (String(coverLetter.userId) !== String(userId)) {
      throw new Error("Unauthorized access to cover letter");
    }

    return coverLetter;
  }
}

module.exports = GetCoverLetter;
