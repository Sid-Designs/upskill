/**
 * Roadmap Prompt Builder
 * - Profile-aware (optional)
 * - Generates structured learning roadmaps with capstone project
 */

function buildRoadmapPrompt({ roadmap, profile = null }) {
  if (!roadmap || !roadmap.goalTitle || !roadmap.durationDays) {
    throw new Error("RoadmapPrompt: missing required fields");
  }

  const profileBlock = profile ? buildProfileBlock(profile) : "";

  const totalWeeks = Math.ceil(roadmap.durationDays / 7);

  // Dynamic node guidance based on duration
  const nodesPerWeek = roadmap.durationDays <= 14 ? "2-3" : "2-4";
  const phaseGuidance =
    roadmap.durationDays <= 14
      ? '2-3 phases (e.g. "Foundation", "Core", "Capstone")'
      : roadmap.durationDays <= 30
      ? '3-4 phases (e.g. "Foundation", "Core Skills", "Advanced", "Capstone")'
      : '4-5 phases (e.g. "Foundation", "Core", "Intermediate", "Advanced", "Capstone")';

  return {
    system: `You are a world-class technical mentor with 15+ years of industry experience. You design personalized, battle-tested learning roadmaps that produce job-ready engineers. You output ONLY valid JSON — no markdown, no explanations, no text outside the JSON object. Every response must strictly follow the provided JSON schema.`,
    messages: [
      {
        role: "user",
        content: `
Generate a structured learning roadmap as PURE JSON. No markdown, no explanation, no text outside the JSON.

═══════════════════════════════════════
LEARNER CONTEXT
═══════════════════════════════════════
- Goal: ${roadmap.goalTitle}
- Duration: ${roadmap.durationDays} days (~${totalWeeks} weeks)
- Current Skill Level: ${roadmap.currentSkillLevel || "Beginner"}
- Target Skill Level: ${roadmap.targetSkillLevel || "Job-Ready"}
- Educational Background: ${roadmap.educationalBackground || "Not specified"}
- Prior Knowledge: ${
          Array.isArray(roadmap.priorKnowledge) && roadmap.priorKnowledge.length > 0
            ? roadmap.priorKnowledge.join(", ")
            : "None specified"
        }
- Preferred Learning Style: ${
          Array.isArray(roadmap.learningStyle) && roadmap.learningStyle.length > 0
            ? roadmap.learningStyle.join(", ")
            : "Not specified"
        }
- Resource Constraints: ${roadmap.resourceConstraints || "None"}
- Career Goal: ${roadmap.careerGoal || "Not specified"}
- Additional Notes: ${roadmap.additionalNotes || "None"}

${profileBlock}

═══════════════════════════════════════
QUALITY RULES — FOLLOW STRICTLY
═══════════════════════════════════════

OUTPUT FORMAT:
- Output MUST be valid JSON — no markdown, no explanations, no text outside JSON
- Follow the schema strictly. Start with { and end with }

STRUCTURE:
- Group weeks into ${phaseGuidance}
- Every week must have ${nodesPerWeek} nodes
- Each node MUST have a unique nodeId like "w1-n1", "w1-n2", "w2-n1" etc.
- Difficulty should progressively increase across phases (1=easy → 5=hard)

CONTENT QUALITY — BE SPECIFIC, NEVER GENERIC:
- "objective" must state exactly what the learner will be able to do after this task (not vague like "understand React")
- "resources" must be real, specific, and useful:
  • If learner prefers videos → YouTube channel names, specific playlists, or Udemy/Coursera course titles
  • If learner prefers reading → official docs pages, specific blog posts, MDN articles
  • Include 1-3 resources per node. Name them specifically (e.g. "Traversy Media - Node.js Crash Course" NOT just "YouTube tutorial")
- "practiceTask" must be a concrete, completable exercise with a clear expected output
  • BAD: "Practice using React hooks"
  • GOOD: "Build a counter component using useState and a timer that auto-increments every second using useEffect. Console-log cleanup on unmount."
- "project" must be a mini-project for that specific node topic. Include what to build and 2-3 specific requirements
  • BAD: "Build a todo app"
  • GOOD: "Build a Task Tracker CLI: reads/writes tasks to a JSON file, supports add/delete/list/mark-done commands, uses colored terminal output"
- "proTip" must be a genuine senior-developer insight — a real-world gotcha, performance tip, or industry practice
  • BAD: "Practice makes perfect"
  • GOOD: "In production, always debounce your search inputs — hitting an API on every keystroke will spike your costs and rate-limit you fast"
- "estimatedHours" should reflect realistic time for someone at the learner's current level
- "successCriteria" should be a clear, testable statement of what "done" looks like

CAPSTONE PROJECT (CRITICAL):
- The "capstoneProject" is a FINAL comprehensive project that ties together EVERYTHING learned across ALL phases
- It must be substantial enough to be portfolio-worthy and demonstrate real competence
- Requirements must be specific, testable, and cover skills from multiple phases
- The techStack must list exact technologies/frameworks the learner should use
- evaluationCriteria must be concrete and checkable (for AI code review later)
- Think of it as: "If someone reviews this project on GitHub, they should be convinced the learner is ${roadmap.targetSkillLevel || "Job-Ready"}"

═══════════════════════════════════════
JSON SCHEMA
═══════════════════════════════════════
{
  "title": "string — roadmap title",
  "summary": "string — 2-3 sentence overview of the entire learning journey and what the learner will achieve",
  "durationDays": ${roadmap.durationDays},
  "phases": [
    {
      "phaseTitle": "string",
      "description": "string — what this phase covers and why it matters",
      "learningOutcomes": ["string — By end of this phase, learner can..."],
      "weeks": [
        {
          "weekNumber": 1,
          "focus": "string — specific weekly focus area",
          "weekSummary": "string — what the learner achieves by end of this week",
          "nodes": [
            {
              "nodeId": "w1-n1",
              "title": "string",
              "objective": "string — specific learning objective (what learner will be able to DO)",
              "estimatedHours": 3,
              "difficulty": 2,
              "successCriteria": "string — You're done when you can...",
              "resources": ["string — specific resource name, course, or doc page"],
              "practiceTask": "string — concrete exercise with expected output",
              "project": "string — mini-project with title, description, and 2-3 requirements",
              "proTip": "string — real-world senior dev insight"
            }
          ]
        }
      ]
    }
  ],
  "capstoneProject": {
    "title": "string — compelling project name",
    "description": "string — 3-4 sentence description of what to build and why it demonstrates mastery",
    "requirements": [
      "string — specific, testable requirement (e.g. 'Implement user authentication with JWT tokens')"
    ],
    "techStack": ["string — exact technology/framework to use"],
    "evaluationCriteria": [
      "string — specific thing to check in code review (e.g. 'Uses proper error handling middleware')"
    ],
    "estimatedHours": 20,
    "difficulty": 5
  }
}

Respond with ONLY the JSON object. Start with { and end with }.
`.trim(),
      },
    ],
  };
}

function buildProfileBlock(profile) {
  const pref = profile.preferences || {};

  return `
═══════════════════════════════════════
CANDIDATE PROFILE (use as background context to personalize — do NOT mention these fields explicitly)
═══════════════════════════════════════
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
  buildRoadmapPrompt,
};