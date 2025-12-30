const { Inngest } = require("inngest");

const inngest = new Inngest({
  id: process.env.INNGEST_ID || "dev-backend",
  name: process.env.INNGEST_NAME || "Backend",
});

module.exports = inngest;
