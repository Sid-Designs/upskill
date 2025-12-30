const CoverLetterModel = require("../db/models/CoverLetter");
const CoverLetter = require("../../domains/coverLetter/entities/CoverLetter");

class CoverLetterRepositoryImpl {
  async create(entity) {
    const doc = await CoverLetterModel.create({
      userId: entity.userId,
      jobTitle: entity.jobTitle,
      companyName: entity.companyName,
      jobDescription: entity.jobDescription,
    });

    return this._toDomain(doc);
  }

  async findById(id) {
    const doc = await CoverLetterModel.findById(id);
    return doc ? this._toDomain(doc) : null;
  }

  async update(entity) {
    const doc = await CoverLetterModel.findByIdAndUpdate(
      entity.id,
      {
        generatedText: entity.generatedText,
        status: entity.status,
        provider: entity.provider,
      },
      { new: true }
    );

    return doc ? this._toDomain(doc) : null;
  }

  async deleteById(id) {
    await CoverLetterModel.deleteOne({ _id: id });
    return true;
  }

  _toDomain(doc) {
    return new CoverLetter({
      id: doc._id.toString(),
      userId: doc.userId,
      jobTitle: doc.jobTitle,
      companyName: doc.companyName,
      jobDescription: doc.jobDescription,
      generatedText: doc.generatedText,
      status: doc.status,
      provider: doc.provider,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

module.exports = CoverLetterRepositoryImpl;
