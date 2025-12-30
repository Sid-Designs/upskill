const CoverLetter = require("../../../domains/coverLetter/entities/CoverLetter");

class CreateCoverLetter {
  constructor({ coverLetterRepository, inngest }) {
    this.coverLetterRepository = coverLetterRepository;
    this.inngest = inngest;
  }

  async execute({ userId, jobTitle, companyName, jobDescription }) {
    if (!userId || !jobTitle || !companyName || !jobDescription) {
      throw new Error("CreateCoverLetter: missing fields");
    }

    const coverLetter = new CoverLetter({
      userId,
      jobTitle,
      companyName,
      jobDescription,
    });

    const saved = await this.coverLetterRepository.create(coverLetter);

    await this.inngest.send({
      name: "ai.generate.cover-letter",
      data: {
        coverLetterId: saved.id,
        userId,
      },
    });

    return saved;
  }
}

module.exports = CreateCoverLetter;
