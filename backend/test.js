const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(
  "AIzaSyA4KaDrfHpLSI9ZVL21PTolv_zRni_Zyy0"
);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(
      "Tell me a joke about programmers."
    );

    console.log("AI Response:");
    console.log(result.response.text());
  } catch (error) {
    console.error("Gemini Error:");
    console.error(error.message);
  }
}

testGemini();
