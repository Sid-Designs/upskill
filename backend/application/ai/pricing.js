const CoverLetter = require("../../infrastructure/db/models/CoverLetter");

const CHAT_CREDIT_COST = {
  career_guidance: 2,
  cover_letter: 20,
  roadmap_planning: 80,
  resume_review: 2,
  interview_prep: 2,
  capstone_review: 5,
};

const FREE_CAPSTONE_SUBMISSIONS = 5;

function getCreditCost(chatType) {
  return CHAT_CREDIT_COST[chatType] || 1;
}

module.exports = { getCreditCost, FREE_CAPSTONE_SUBMISSIONS };
