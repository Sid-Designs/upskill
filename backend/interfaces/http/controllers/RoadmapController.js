const CreateRoadmap = require("../../../application/roadmap/usecases/CreateRoadmap");
const GetRoadmap = require("../../../application/roadmap/usecases/GetRoadmap");
const GetUserRoadmaps = require("../../../application/roadmap/usecases/GetUserRoadmaps");
const DeleteRoadmap = require("../../../application/roadmap/usecases/DeleteRoadmap");
const UpdateProgress = require("../../../application/roadmap/usecases/UpdateProgress");
const VerifyCapstoneProject = require("../../../application/roadmap/usecases/VerifyCapstoneProject");

const RoadmapRepositoryImpl = require("../../../infrastructure/repositories/RoadmapRepositoryImpl");
const ProfileRepositoryImpl = require("../../../infrastructure/repositories/ProfileRepositoryImpl");

const inngest = require("../../../infrastructure/inngest/client");

// Repositories
const roadmapRepository = new RoadmapRepositoryImpl();
const profileRepository = new ProfileRepositoryImpl();

// Use cases
const createRoadmap = new CreateRoadmap({
  roadmapRepository,
  inngest,
});

const getRoadmap = new GetRoadmap({
  roadmapRepository,
});

const getUserRoadmaps = new GetUserRoadmaps({
  roadmapRepository,
});

const deleteRoadmapUseCase = new DeleteRoadmap({
  roadmapRepository,
});

const updateProgress = new UpdateProgress({
  roadmapRepository,
});

const verifyCapstoneProject = new VerifyCapstoneProject({
  roadmapRepository,
  profileRepository,
});

// Generate a new roadmap
const generate = async (req, res) => {
  const userId = req.user.id;
  const {
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
  } = req.body;

  const result = await createRoadmap.execute({
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
  });

  res.status(202).json({
    success: true,
    data: result,
  });
};

// PUBLIC: Verify certificate (no auth required)
const verifyCertificate = async (req, res) => {
  const { roadmapId } = req.params;

  // Get roadmap directly from repository (no user check)
  const roadmap = await roadmapRepository.findById(roadmapId);

  if (!roadmap) {
    return res.status(404).json({
      success: false,
      valid: false,
      message: "Certificate not found",
    });
  }

  // Check if capstone is passed
  const isValid = roadmap.capstoneStatus === "passed";
  const latestSubmission = roadmap.capstoneSubmissions?.length
    ? roadmap.capstoneSubmissions[roadmap.capstoneSubmissions.length - 1]
    : null;

  // Return limited public data for verification
  res.status(200).json({
    success: true,
    valid: isValid,
    message: isValid
      ? "This certificate is valid and verified."
      : "This certificate could not be verified. The capstone project may not have been completed.",
    certificate: {
      id: roadmap.id,
      title: roadmap.generatedContent?.title || roadmap.goalTitle,
      phases: roadmap.generatedContent?.phases?.length || 0,
      tasksCompleted: roadmap.completedNodesCount || 0,
      totalTasks: roadmap.totalNodes || 0,
      capstoneProject: roadmap.generatedContent?.capstoneProject?.title || null,
      capstoneStatus: roadmap.capstoneStatus,
      score: latestSubmission?.score || null,
      completedAt: latestSubmission?.submittedAt || null,
      githubUrl: latestSubmission?.githubUrl || null,
    },
  });
};

// Get a single roadmap by ID
const getById = async (req, res) => {
  const userId = req.user.id;
  const { roadmapId } = req.params;

  const roadmap = await getRoadmap.execute({
    userId,
    roadmapId,
  });

  res.status(200).json({
    success: true,
    data: roadmap,
  });
};

// Get all roadmaps for the authenticated user
const getAll = async (req, res) => {
  const userId = req.user.id;

  const roadmaps = await getUserRoadmaps.execute(userId);

  res.status(200).json({
    success: true,
    data: roadmaps,
  });
};

// Delete a roadmap
const deleteRoadmap = async (req, res) => {
  const userId = req.user.id;
  const { roadmapId } = req.params;

  await deleteRoadmapUseCase.execute({
    userId,
    roadmapId,
  });

  res.status(200).json({
    success: true,
    message: "Roadmap deleted",
  });
};

// Update roadmap progress (completed nodes)
const updateRoadmapProgress = async (req, res) => {
  const userId = req.user.id;
  const { roadmapId } = req.params;
  const { completedNodes } = req.body;

  const result = await updateProgress.execute({
    userId,
    roadmapId,
    completedNodes,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

// Verify capstone project via GitHub repo
const verifyCapstone = async (req, res) => {
  const userId = req.user.id;
  const { roadmapId } = req.params;
  const { githubUrl } = req.body;

  const result = await verifyCapstoneProject.execute({
    userId,
    roadmapId,
    githubUrl,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

module.exports = {
  generate,
  getById,
  getAll,
  deleteRoadmap,
  updateRoadmapProgress,
  verifyCapstone,
  verifyCertificate,
};
