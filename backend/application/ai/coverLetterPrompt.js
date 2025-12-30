function buildCoverLetterPrompt({
  jobTitle,
  companyName,
  jobDescription,
  profile = null,
}) {
  if (!jobTitle || !companyName || !jobDescription) {
    throw new Error("CoverLetterPrompt: missing required fields");
  }

  const profileBlock = profile ? buildProfileBlock(profile) : "";

  return {
    messages: [
      {
        role: "system",
        content:
          "You are a professional career assistant who writes formal, corporate-grade cover letters.",
      },
      {
        role: "user",
        content: `
Generate a formal, professional cover letter with EXACTLY the structure below
and NOTHING ELSE:

1. Subject (single line starting with "Subject:")
2. Greeting (must start with "Dear")
3. Introduction (2–3 sentences)
4. Skills & Experience (4–6 sentences aligned to the job description)
5. Closing (2 sentences)
6. Signature (candidate name only)

Rules:
- Use a formal corporate tone
- Tailor content specifically to the company and role
- Do NOT explain anything
- Do NOT include markdown
- Do NOT use bullet points
- Do NOT mention AI or prompts
- Do NOT add extra sections
- Return plain text only

Job Title:
${jobTitle}

Company Name:
${companyName}

Job Description:
${jobDescription}

Use the candidate profile only as background context.
Do NOT mention profile fields explicitly.

${profileBlock}

End the response after the signature.
`.trim(),
      },
    ],
  };
}

function buildProfileBlock(profile) {
  const pref = profile.preferences || {};

  return `
Candidate Profile:
- Name: ${profile.username || "Not specified"}
- Bio: ${profile.bio || "Not specified"}
- Career Goal: ${pref.careerGoal || "Not specified"}
- Experience Level: ${pref.experienceLevel || "Not specified"}
- Preferred Technologies: ${
    Array.isArray(pref.preferredTech)
      ? pref.preferredTech.join(", ")
      : "Not specified"
  }
`.trim();
}

module.exports = {
  buildCoverLetterPrompt,
};
