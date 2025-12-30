class CoverLetter {
  constructor({
    id,
    userId,
    jobTitle,
    companyName,
    jobDescription,
    generatedText,
    status = "pending",
    provider,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.jobTitle = jobTitle;
    this.companyName = companyName;
    this.jobDescription = jobDescription;
    this.generatedText = generatedText;
    this.status = status;
    this.provider = provider;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  complete(text, provider) {
    this.generatedText = text;
    this.provider = provider;
    this.status = "completed";
    this.updatedAt = new Date();
  }

  fail() {
    this.status = "failed";
    this.updatedAt = new Date();
  }
}

module.exports = CoverLetter;
