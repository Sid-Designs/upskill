/**
 * Prompt Builder
 * - Pure function
 * - Profile-aware (optional)
 * - Production-safe
 */

const SYSTEM_PROMPTS = {
  career_guidance:
    "You are a senior career mentor. Provide clear, practical guidance tailored to the user's background and goals.",
  resume_review:
    "You are an expert resume reviewer. Give concise, actionable feedback.",
  interview_prep:
    "You are an interview coach. Ask relevant questions and give strong answers.",
  roadmap_planning:
    "You are a technical mentor. Create step-by-step learning roadmaps.",
};

function buildPrompt({ chatType, context, userProfile = null }) {
  if (!chatType) {
    throw new Error("PromptBuilder: chatType is required");
  }

  if (!Array.isArray(context)) {
    throw new Error("PromptBuilder: context must be an array");
  }

  // 1️⃣ Base system prompt (role definition)
  const systemPrompt =
    SYSTEM_PROMPTS[chatType] ||
    "You are a helpful assistant. Respond clearly and accurately.";

  // 2️⃣ Normalize chat messages
  const messages = context
    .filter((m) => m.role && typeof m.content === "string")
    .filter((m) => !(m.role === "assistant" && m.content.trim() === ""))
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  // 3️⃣ OPTIONAL profile injection (THIS IS THE FIX)
  const hasProfileData =
    userProfile &&
    (Boolean(userProfile.bio) ||
      (userProfile.preferences &&
        Object.keys(userProfile.preferences).length > 0));

  if (hasProfileData) {
    messages.unshift({
      role: "system",
      content: buildUserContext(userProfile),
    });
  }

  // 4️⃣ Final prompt
  return {
    system: systemPrompt,
    messages,
  };
}

// Prefenece
function buildUserContext(profile) {
  const pref = profile.preferences || {};

  return `User profile:- Name: ${profile.username || "Not specified"}- Bio: ${
    profile.bio || "Not specified"
  }- Career goal: ${pref.careerGoal || "Not specified"}- Experience level: ${
    pref.experienceLevel || "Not specified"
  }- Preferred technologies: ${
    Array.isArray(pref.preferredTech)
      ? pref.preferredTech.join(", ")
      : "Not specified"
  } Use this information to personalize the response.
`.trim();
}

module.exports = {
  buildPrompt,
};
