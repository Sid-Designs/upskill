const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../../../infrastructure/errors/AppError");

const { fetchRepository } = require("../../../infrastructure/github/GitHubService");
const { buildCapstoneReviewPrompt } = require("../../ai/capstoneReviewPrompt");
const { getAIProvider } = require("../../ai/providers/ProviderFactory");
const { getCreditCost, FREE_CAPSTONE_SUBMISSIONS } = require("../../ai/pricing");

class VerifyCapstoneProject {
  constructor({ roadmapRepository, profileRepository }) {
    this.roadmapRepository = roadmapRepository;
    this.profileRepository = profileRepository;
  }

  async execute({ userId, roadmapId, githubUrl }) {
    // ── Validation ──
    if (!userId) throw new BadRequestError("userId is required");
    if (!roadmapId) throw new BadRequestError("roadmapId is required");
    if (!githubUrl || typeof githubUrl !== "string") {
      throw new BadRequestError("githubUrl is required");
    }

    // Validate GitHub URL format
    const urlPattern = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/;
    if (!urlPattern.test(githubUrl.trim())) {
      throw new BadRequestError(
        "Invalid GitHub URL. Expected: https://github.com/owner/repo"
      );
    }

    // ── Load roadmap ──
    const roadmap = await this.roadmapRepository.findById(roadmapId);
    if (!roadmap) throw new NotFoundError("Roadmap not found");
    if (String(roadmap.userId) !== String(userId)) {
      throw new UnauthorizedError("Unauthorized access to roadmap");
    }

    // Must be generated
    if (roadmap.status !== "completed" || !roadmap.generatedContent?.phases) {
      throw new BadRequestError("Roadmap hasn't been generated yet");
    }

    // Must have a capstone project in the generated content
    const capstone = roadmap.generatedContent.capstoneProject;
    if (!capstone || !capstone.requirements || !capstone.evaluationCriteria) {
      throw new BadRequestError(
        "This roadmap doesn't have a capstone project. It may have been generated with an older version."
      );
    }

    // All learning nodes must be completed first
    const allNodeIds = roadmap.getAllNodeIds();
    const completedSet = new Set(roadmap.completedNodes || []);
    const allNodesDone = allNodeIds.every((id) => completedSet.has(id));
    if (!allNodesDone) {
      throw new BadRequestError(
        "Complete all learning tasks before submitting your capstone project"
      );
    }

    // ── Credit check (first N submissions are free per roadmap) ──
    const previousSubmissions = roadmap.capstoneSubmissions?.length || 0;
    const isFreeSubmission = previousSubmissions < FREE_CAPSTONE_SUBMISSIONS;
    const cost = isFreeSubmission ? 0 : getCreditCost("capstone_review");

    const profile = await this.profileRepository.getUserProfile(userId);
    if (cost > 0 && (!profile || profile.credits < cost)) {
      throw new BadRequestError(
        `Not enough credits. Capstone review costs ${cost} credits after ${FREE_CAPSTONE_SUBMISSIONS} free submissions.`
      );
    }

    // ── Fetch GitHub repo ──
    let repoData;
    try {
      repoData = await fetchRepository(githubUrl.trim());
    } catch (err) {
      throw new BadRequestError(err.message);
    }

    if (!repoData.files || repoData.files.length === 0) {
      throw new BadRequestError(
        "Could not read any files from the repository. Make sure the repo is public and contains code."
      );
    }

    // ── AI Review ──
    const prompt = buildCapstoneReviewPrompt({
      capstoneProject: capstone,
      repoData,
      roadmapGoal: roadmap.goalTitle,
    });

    const provider = getAIProvider("capstone_review");
    const aiResult = await provider.generate(prompt);

    // ── Parse AI response ──
    let review;
    try {
      let raw = aiResult.text.trim();
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      review = JSON.parse(raw);
    } catch {
      throw new BadRequestError(
        "AI review response was malformed. Please try again."
      );
    }

    // Validate review structure
    if (!review.verdict || !["pass", "partial", "fail"].includes(review.verdict)) {
      review.verdict = "fail";
    }
    if (typeof review.score !== "number") {
      review.score = 0;
    }

    // // TODO: REMOVE THIS — temporary override for testing pass flow
    // review.verdict = "pass";
    // review.score = 95;

    // ── Build submission record ──
    const submission = {
      githubUrl: githubUrl.trim(),
      verdict: review.verdict,
      score: review.score,
      requirementResults: review.requirementResults || [],
      strengths: review.strengths || [],
      improvements: review.improvements || [],
      overallFeedback: review.overallFeedback || "",
      submittedAt: new Date(),
    };

    // ── Determine capstone status ──
    const capstoneStatus = review.verdict === "pass" ? "passed" : "failed";

    // ── Compute learning status (completed only if capstone passes) ──
    roadmap.capstoneStatus = capstoneStatus;
    roadmap.recomputeProgress();
    const learningStatus = roadmap.learningStatus;

    // ── Save ──
    await this.roadmapRepository.addCapstoneSubmission(
      roadmapId,
      submission,
      capstoneStatus,
      learningStatus
    );

    // ── Deduct credits (only if not a free submission) ──
    if (cost > 0) {
      await this.profileRepository.deductCredits(userId, cost);
    }

    const freeLeft = Math.max(0, FREE_CAPSTONE_SUBMISSIONS - (previousSubmissions + 1));

    return {
      submission,
      capstoneStatus,
      learningStatus,
      creditsUsed: cost,
      freeSubmissionsLeft: freeLeft,
    };
  }
}

module.exports = VerifyCapstoneProject;
