class GetUserCoverLetters {
  constructor({ coverLetterRepository }) {
    this.coverLetterRepository = coverLetterRepository;
  }

  async execute(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const coverLetters =
      await this.coverLetterRepository.findAllByUserId(userId);

    return coverLetters.map(letter => ({
      id: letter.id,
      jobTitle: letter.jobTitle,
      companyName: letter.companyName,
      createdAt: letter.createdAt
    }));
  }
}

module.exports = GetUserCoverLetters;
