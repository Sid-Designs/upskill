const Roadmap = require("../../../domains/roadmap/entities/Roadmap");
const {
  BadRequestError,
} = require("../../../infrastructure/errors/AppError");

class CreateRoadmap {
  constructor({ roadmapRepository, inngest }) {
    this.roadmapRepository = roadmapRepository;
    this.inngest = inngest;
  }

  async execute({
    userId,
    goalTitle,
    durationDays,
    currentSkillLevel,
    targetSkillLevel,
    educationalBackground,
    priorKnowledge,
    learningStyle,
    resourceConstraints,
    careerGoal,
    additionalNotes,
  }) {
    if (!userId || !goalTitle || !durationDays || !educationalBackground) {
      throw new BadRequestError("Missing required fields: goalTitle, durationDays, and educationalBackground are required");
    }

    if (durationDays < 7 || durationDays > 365) {
      throw new BadRequestError("Duration must be between 7 and 365 days");
    }

    if (goalTitle.length > 200) {
      throw new BadRequestError("Goal title must be 200 characters or less");
    }

    const roadmap = new Roadmap({
      userId,
      goalTitle: goalTitle.trim(),
      durationDays,
      currentSkillLevel: currentSkillLevel || "Beginner",
      targetSkillLevel: targetSkillLevel || "Job-Ready",
      educationalBackground: educationalBackground.trim(),
      priorKnowledge: priorKnowledge || [],
      learningStyle: learningStyle || ["Hands-on"],
      resourceConstraints: resourceConstraints || null,
      careerGoal: careerGoal || null,
      additionalNotes: additionalNotes || null,
    });

    const saved = await this.roadmapRepository.create(roadmap);

    // Trigger async AI generation via Inngest
    await this.inngest.send({
      name: "ai.generate.roadmap",
      data: {
        roadmapId: saved.id,
        userId,
      },
    });

    return saved;
  }
}

module.exports = CreateRoadmap;
