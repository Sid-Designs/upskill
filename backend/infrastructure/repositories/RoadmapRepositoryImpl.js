const RoadmapModel = require("../db/models/Roadmap");
const Roadmap = require("../../domains/roadmap/entities/Roadmap");

class RoadmapRepositoryImpl {
  async create(entity) {
    const doc = await RoadmapModel.create({
      userId: entity.userId,
      goalTitle: entity.goalTitle,
      durationDays: entity.durationDays,
      currentSkillLevel: entity.currentSkillLevel,
      targetSkillLevel: entity.targetSkillLevel,
      educationalBackground: entity.educationalBackground,
      priorKnowledge: entity.priorKnowledge,
      learningStyle: entity.learningStyle,
      resourceConstraints: entity.resourceConstraints,
      careerGoal: entity.careerGoal,
      additionalNotes: entity.additionalNotes,
    });

    return this._toDomain(doc);
  }

  async findById(id) {
    const doc = await RoadmapModel.findById(id);
    return doc ? this._toDomain(doc) : null;
  }

  async update(entity) {
    const updateData = {
      generatedContent: entity.generatedContent,
      status: entity.status,
      provider: entity.provider,
    };

    // Recompute progress fields when content is saved (generation complete)
    if (entity.generatedContent && entity.generatedContent.phases) {
      const domain = new Roadmap(entity);
      domain.recomputeProgress();
      updateData.totalNodes = domain.totalNodes;
      updateData.progressPercent = domain.progressPercent;
      updateData.learningStatus = domain.learningStatus;
    }

    const doc = await RoadmapModel.findByIdAndUpdate(
      entity.id,
      updateData,
      { new: true }
    );

    return doc ? this._toDomain(doc) : null;
  }

  async updateProgress(id, completedNodes, totalNodes, progressPercent, learningStatus) {
    const doc = await RoadmapModel.findByIdAndUpdate(
      id,
      { completedNodes, totalNodes, progressPercent, learningStatus },
      { new: true }
    );
    return doc ? this._toDomain(doc) : null;
  }

  async addCapstoneSubmission(id, submission, capstoneStatus, learningStatus) {
    const doc = await RoadmapModel.findByIdAndUpdate(
      id,
      {
        $push: { capstoneSubmissions: submission },
        $set: { capstoneStatus, learningStatus },
      },
      { new: true }
    );
    return doc ? this._toDomain(doc) : null;
  }

  async deleteById(id) {
    await RoadmapModel.deleteOne({ _id: id });
    return true;
  }

  async findAllByUserId(userId) {
    const docs = await RoadmapModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map((doc) => this._toDomain(doc));
  }

  _toDomain(doc) {
    return new Roadmap({
      id: doc._id.toString(),
      userId: doc.userId,
      goalTitle: doc.goalTitle,
      durationDays: doc.durationDays,
      currentSkillLevel: doc.currentSkillLevel,
      targetSkillLevel: doc.targetSkillLevel,
      educationalBackground: doc.educationalBackground,
      priorKnowledge: doc.priorKnowledge,
      learningStyle: doc.learningStyle,
      resourceConstraints: doc.resourceConstraints,
      careerGoal: doc.careerGoal,
      additionalNotes: doc.additionalNotes,
      generatedContent: doc.generatedContent,
      status: doc.status,
      provider: doc.provider,
      completedNodes: doc.completedNodes || [],
      totalNodes: doc.totalNodes || 0,
      progressPercent: doc.progressPercent || 0,
      learningStatus: doc.learningStatus || "not_started",
      capstoneStatus: doc.capstoneStatus || "not_started",
      capstoneSubmissions: doc.capstoneSubmissions || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

module.exports = RoadmapRepositoryImpl;
