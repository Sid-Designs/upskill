const inngest = require("../client");

const CoverLetterRepositoryImpl =
  require("../../repositories/CoverLetterRepositoryImpl");
const ProfileRepositoryImpl =
  require("../../repositories/ProfileRepositoryImpl");

const {
  buildCoverLetterPrompt,
} = require("../../../application/ai/coverLetterPrompt");

const {
  getAIProvider,
} = require("../../../application/ai/providers/ProviderFactory");

const { getCreditCost } =
  require("../../../application/ai/pricing");

const coverLetterRepo = new CoverLetterRepositoryImpl();
const profileRepo = new ProfileRepositoryImpl();

module.exports = inngest.createFunction(
  {
    id: "ai.generate.cover-letter",
    name: "generate-ai-cover-letter",
  },
  {
    event: "ai.generate.cover-letter",
  },

  async ({ event }) => {
    const { coverLetterId, userId } = event.data;


    /* 1️⃣ Load cover letter */
    const coverLetter = await coverLetterRepo.findById(coverLetterId);
    if (!coverLetter) {
      console.warn("[Inngest] Cover letter not found");
      return;
    }

    /* 2️⃣ Load profile (MANDATORY) */
    const profile = await profileRepo.getUserProfile(userId);
    if (!profile) {
      coverLetter.fail();
      coverLetter.generatedText =
        "Please complete your profile before generating a cover letter.";
      await coverLetterRepo.update(coverLetter);
      return;
    }

    /* 3️⃣ Credit check */
    const cost = getCreditCost("cover_letter");
    if (profile.credits < cost) {
      coverLetter.fail();
      coverLetter.generatedText =
        "You do not have enough credits to generate a cover letter.";
      await coverLetterRepo.update(coverLetter);
      return;
    }

    /* 4️⃣ Build prompt */
    const prompt = buildCoverLetterPrompt({
      jobTitle: coverLetter.jobTitle,
      companyName: coverLetter.companyName,
      jobDescription: coverLetter.jobDescription,
      profile,
    });

    /* 5️⃣ Call AI (SAME FLOW AS CHAT) */
    const provider = getAIProvider("cover_letter");
    const aiResult = await provider.generate(prompt);

    console.log("[Inngest] AI cover letter generated", {
      coverLetterId,
      provider: aiResult.provider,
    });

    /* 6️⃣ Save AI result */
    coverLetter.complete(aiResult.text, aiResult.provider);
    await coverLetterRepo.update(coverLetter);

    /* 7️⃣ Deduct credits */
    await profileRepo.deductCredits(userId, cost);

    console.log("[Inngest] Cover letter generated & credits deducted");
  }
);
