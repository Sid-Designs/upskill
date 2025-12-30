const { serve } = require("inngest/express");
const inngest = require("./client");

// Chat AI
const processAiMessage =
  require("./functions/processAiMessage");

// Cover Letter AI
const generateCoverLetter =
  require("./functions/generateCoverLetter");

module.exports = serve({
  client: inngest,
  functions: [
    processAiMessage,
    generateCoverLetter,
  ],
});
