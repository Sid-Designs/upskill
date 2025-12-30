const CoverLetter = require("../../infrastructure/db/models/CoverLetter");

const CHAT_CREDIT_COST = {
  career_guidance: 2,
  cover_letter: 3,
  roadmap_planning: 3,
  resume_review: 2,
  interview_prep: 2,
};

function getCreditCost(chatType) {
  return CHAT_CREDIT_COST[chatType] || 1;
}

module.exports = { getCreditCost };
