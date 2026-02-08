/**
 * Capstone Review Prompt Builder
 * - Takes capstone project requirements + GitHub repo contents
 * - AI evaluates whether the project meets the requirements
 */

function buildCapstoneReviewPrompt({ capstoneProject, repoData, roadmapGoal }) {
  if (!capstoneProject || !repoData) {
    throw new Error("CapstoneReviewPrompt: missing required fields");
  }

  // Build file tree summary
  const fileTreeSummary = repoData.fileTree.slice(0, 50).join("\n  ");
  const fileTreeTruncated =
    repoData.fileTree.length > 50
      ? `\n  ... and ${repoData.fileTree.length - 50} more files`
      : "";

  // Build file contents block
  const fileContentsBlock = repoData.files
    .map(
      (f) =>
        `── ${f.path} ──\n${f.content.substring(0, 8000)}${
          f.content.length > 8000 ? "\n... (truncated)" : ""
        }`
    )
    .join("\n\n");

  return {
    system: `You are a senior software engineer conducting a thorough but fair code review. You evaluate student projects against specific requirements. You are encouraging but honest — you want the student to succeed, but you won't pass work that doesn't meet the criteria. You output ONLY valid JSON — no markdown, no explanations, no text outside the JSON object.`,
    messages: [
      {
        role: "user",
        content: `
Review this GitHub repository and evaluate whether it meets the capstone project requirements.

═══════════════════════════════════════
ROADMAP GOAL
═══════════════════════════════════════
${roadmapGoal}

═══════════════════════════════════════
CAPSTONE PROJECT REQUIREMENTS
═══════════════════════════════════════
Title: ${capstoneProject.title}
Description: ${capstoneProject.description}

Requirements:
${capstoneProject.requirements.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}

Tech Stack Expected: ${capstoneProject.techStack.join(", ")}

Evaluation Criteria:
${capstoneProject.evaluationCriteria.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

═══════════════════════════════════════
REPOSITORY CONTENTS
═══════════════════════════════════════
Repository: ${repoData.owner}/${repoData.repo}
Branch: ${repoData.branch}
Total Files: ${repoData.totalFiles}

File Tree:
  ${fileTreeSummary}${fileTreeTruncated}

═══════════════════════════════════════
KEY FILE CONTENTS
═══════════════════════════════════════
${fileContentsBlock}

═══════════════════════════════════════
REVIEW INSTRUCTIONS
═══════════════════════════════════════
1. Check EACH requirement individually — is it met based on the actual code?
2. Be specific in feedback — reference actual file names and code patterns you see
3. "partial" verdict: most requirements met but 1-2 critical ones missing
4. "pass" verdict: ALL requirements are substantially met (minor imperfections OK)
5. "fail" verdict: multiple core requirements are missing or the code is fundamentally incomplete
6. Give actionable, encouraging feedback — tell the student exactly what to fix
7. Score from 0-100 based on overall completeness and code quality
8. Use inline markdown in your text: wrap file names, function names, variable names, and code snippets in backticks like \`App.js\` or \`useState\`. Use **bold** for key terms or emphasis. This helps readability.

Respond with ONLY this JSON:
{
  "verdict": "pass" | "partial" | "fail",
  "score": 85,
  "requirementResults": [
    {
      "requirement": "exact requirement text",
      "met": true,
      "feedback": "Found the route handler in \`src/routes/users.js\` with proper validation using **express-validator**. Well structured."
    }
  ],
  "strengths": ["Clean component structure in \`src/components/\` with proper separation of concerns"],
  "improvements": ["Add error handling in \`src/api/index.js\` — the \`fetchData\` function should wrap the fetch call in a **try/catch** block"],
  "overallFeedback": "2-3 sentence summary of the review — encouraging, honest, actionable. Reference specific files and patterns."
}

Start with { and end with }.
`.trim(),
      },
    ],
  };
}

module.exports = {
  buildCapstoneReviewPrompt,
};
