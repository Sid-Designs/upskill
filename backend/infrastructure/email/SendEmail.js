const fs = require("fs");
const path = require("path");
const transporter = require("../mailer/transporter");

const sendEmailFromTemplate = async ({
  to,
  subject,
  templateName,
  variables,
}) => {
  try {
    const templatePath = path.join(__dirname, "templates", templateName);

    let html = fs.readFileSync(templatePath, "utf-8");

    // Replace placeholders
    Object.keys(variables).forEach((key) => {
      const placeholder = `{{${key}}}`;
      html = html.replaceAll(placeholder, variables[key]);
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email sending failed:", err.message);
  }
};

module.exports = sendEmailFromTemplate;
