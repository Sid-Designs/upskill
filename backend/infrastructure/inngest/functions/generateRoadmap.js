const inngest = require("../client");

const RoadmapRepositoryImpl = require("../../repositories/RoadmapRepositoryImpl");
const ProfileRepositoryImpl = require("../../repositories/ProfileRepositoryImpl");
const Roadmap = require("../../../domains/roadmap/entities/Roadmap");

const {
  buildRoadmapPrompt,
} = require("../../../application/ai/roadmapPromt");

const {
  getAIProvider,
} = require("../../../application/ai/providers/ProviderFactory");

const { getCreditCost } = require("../../../application/ai/pricing");

const roadmapRepo = new RoadmapRepositoryImpl();
const profileRepo = new ProfileRepositoryImpl();

const sseManager = require("../../sse/SseConnectionManager");

module.exports = inngest.createFunction(
  {
    id: "ai.generate.roadmap",
    name: "generate-ai-roadmap",
  },
  {
    event: "ai.generate.roadmap",
  },

  async ({ event, step }) => {
    const { roadmapId, userId } = event.data;

    /* 1️⃣ Load roadmap */
    const roadmap = await step.run("load-roadmap", async () => {
      return roadmapRepo.findById(roadmapId);
    });

    if (!roadmap) {
      console.warn("[Inngest] Roadmap not found");
      return { status: "failed", reason: "not_found" };
    }

    /* 2️⃣ Load profile (optional but helpful for personalization) */
    const profile = await step.run("load-profile", async () => {
      return profileRepo.getUserProfile(userId);
    });

    if (!profile) {
      await step.run("handle-no-profile", async () => {
        roadmap.status = "failed";
        roadmap.generatedContent =
          "Please complete your profile before generating a roadmap.";
        await roadmapRepo.update(roadmap);
      });

      sseManager.notify(
        roadmapId,
        "failed",
        {
          reason: "profile_incomplete",
          roadmapId,
        },
        { retry: true, maxRetries: 10, retryDelay: 300 }
      );

      return { status: "failed", reason: "profile_incomplete" };
    }

    /* 3️⃣ Credit check */
    const cost = getCreditCost("roadmap_planning");
    if (profile.credits < cost) {
      await step.run("handle-insufficient-credits", async () => {
        roadmap.status = "failed";
        roadmap.generatedContent =
          "You do not have enough credits to generate a roadmap.";
        await roadmapRepo.update(roadmap);
      });

      sseManager.notify(
        roadmapId,
        "failed",
        {
          reason: "insufficient_credits",
          roadmapId,
        },
        { retry: true, maxRetries: 10, retryDelay: 300 }
      );

      return { status: "failed", reason: "insufficient_credits" };
    }

    /* 4️⃣ Build prompt (profile-aware) */
    const prompt = buildRoadmapPrompt({
      roadmap,
      profile,
    });

    /* 5️⃣ Call AI */
    const aiResult = await step.run("call-ai", async () => {
      const provider = getAIProvider("roadmap_planning");
      return provider.generate(prompt);
    });

    /* 6️⃣ Parse & save AI result */
    await step.run("save-result", async () => {
      let parsed;
      try {
        // Strip markdown fences if AI wraps in ```json ... ```
        let raw = aiResult.text.trim();
        raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
        parsed = JSON.parse(raw);
      } catch (err) {
        console.warn("[Inngest] Failed to parse roadmap JSON, saving raw text", err.message);
        parsed = { raw: aiResult.text };
      }
      roadmap.generatedContent = parsed;
      roadmap.provider = aiResult.provider;
      roadmap.status = "completed";

      // Compute totalNodes from generated content
      if (parsed && parsed.phases) {
        const domain = new Roadmap(roadmap);
        domain.recomputeProgress();
        roadmap.totalNodes = domain.totalNodes;
        roadmap.progressPercent = domain.progressPercent;
        roadmap.learningStatus = domain.learningStatus;
      }

      await roadmapRepo.update(roadmap);
    });

    /* 7️⃣ Deduct credits */
    await step.run("deduct-credits", async () => {
      await profileRepo.deductCredits(userId, cost);
    });

    console.log("[Inngest] Roadmap generated & credits deducted");

    /* 8️⃣ Notify client via SSE */
    sseManager.notify(
      roadmapId,
      "completed",
      {
        message: "roadmap_completed",
        roadmapId,
      },
      { retry: true, maxRetries: 10, retryDelay: 300 }
    );

    return { status: "completed", roadmapId };
  }
);
