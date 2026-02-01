const inngest = require("../client");

const CoverLetterRepositoryImpl = require("../../repositories/CoverLetterRepositoryImpl");
const ProfileRepositoryImpl = require("../../repositories/ProfileRepositoryImpl");

const {
  buildCoverLetterPrompt,
} = require("../../../application/ai/coverLetterPrompt");

const {
  getAIProvider,
} = require("../../../application/ai/providers/ProviderFactory");

const { getCreditCost } = require("../../../application/ai/pricing");

const coverLetterRepo = new CoverLetterRepositoryImpl();
const profileRepo = new ProfileRepositoryImpl();

const sseManager = require("../../sse/SseConnectionManager");

module.exports = inngest.createFunction(
  {
    id: "ai.generate.cover-letter",
    name: "generate-ai-cover-letter",
  },
  {
    event: "ai.generate.cover-letter",
  },

  async ({ event, step }) => {
    const { coverLetterId, userId } = event.data;

    /* 1️⃣ Load cover letter */
    const coverLetter = await step.run("load-cover-letter", async () => {
      return coverLetterRepo.findById(coverLetterId);
    });
    
    if (!coverLetter) {
      console.warn("[Inngest] Cover letter not found");
      return { status: "failed", reason: "not_found" };
    }

    /* 2️⃣ Load profile (MANDATORY) */
    const profile = await step.run("load-profile", async () => {
      return profileRepo.getUserProfile(userId);
    });
    
    if (!profile) {
      await step.run("handle-no-profile", async () => {
        coverLetter.fail();
        coverLetter.generatedText =
          "Please complete your profile before generating a cover letter.";
        await coverLetterRepo.update(coverLetter);
      });
      
      sseManager.notify(coverLetterId, "failed", {
        reason: "profile_incomplete",
        coverLetterId,
      }, { retry: true, maxRetries: 10, retryDelay: 300 });
      
      return { status: "failed", reason: "profile_incomplete" };
    }

    /* 3️⃣ Credit check */
    const cost = getCreditCost("cover_letter");
    if (profile.credits < cost) {
      await step.run("handle-insufficient-credits", async () => {
        coverLetter.fail();
        coverLetter.generatedText =
          "You do not have enough credits to generate a cover letter.";
        await coverLetterRepo.update(coverLetter);
      });
      
      sseManager.notify(coverLetterId, "failed", {
        reason: "insufficient_credits",
        coverLetterId,
      }, { retry: true, maxRetries: 10, retryDelay: 300 });
      
      return { status: "failed", reason: "insufficient_credits" };
    }

    /* 4️⃣ Build prompt */
    const prompt = buildCoverLetterPrompt({
      jobTitle: coverLetter.jobTitle,
      companyName: coverLetter.companyName,
      jobDescription: coverLetter.jobDescription,
      profile,
    });

    /* 5️⃣ Call AI (SAME FLOW AS CHAT) */
    const aiResult = await step.run("call-ai", async () => {
      const provider = getAIProvider("cover_letter");
      return provider.generate(prompt);
    });

    /* 6️⃣ Save AI result */
    await step.run("save-result", async () => {
      coverLetter.complete(aiResult.text, aiResult.provider);
      await coverLetterRepo.update(coverLetter);
    });

    /* 7️⃣ Deduct credits */
    await step.run("deduct-credits", async () => {
      await profileRepo.deductCredits(userId, cost);
    });

    console.log("[Inngest] Cover letter generated & credits deducted");

    /* 8️⃣ Notify client with retry mechanism */
    sseManager.notify(coverLetterId, "completed", {
      message: "cover_letter_completed",
      coverLetterId,
    }, { retry: true, maxRetries: 10, retryDelay: 300 });
    
    return { status: "completed", coverLetterId };
  }
);
