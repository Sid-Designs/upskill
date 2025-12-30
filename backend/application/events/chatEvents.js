const inngest = require("../../infrastructure/inngest/client");

async function triggerChatGeneration(payload) {
  await inngest.send({
    name: "generateChat",
    data: payload,
  });
}

module.exports = { triggerChatGeneration };
