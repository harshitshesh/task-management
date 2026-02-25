const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testChatbotAccuracy() {
    try {
        console.log("--- CHATBOT ACCURACY TEST ---");

        // 1. Mock Task Data (Simulating what's in the DB)
        const mockTasks = [
            { title: "Complete project documentation", description: "Write README and API docs", status: "Pending", created: new Date() },
            { title: "Fix login bug", description: "User cannot reset password", status: "Pending", created: new Date() },
            { title: "Dashboard UI", description: "Improve sidebar animations", status: "Completed", created: new Date() }
        ];

        console.log("Mock Context:", JSON.stringify(mockTasks, null, 2));

        // 2. Initialize Gemini (Same as controller)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // 3. System Prompt (Same as controller)
        const systemPrompt = `
      You are an AI assistant for a "TaskFlow" management website.
      Your primary goal is to help users manage their tasks and answer questions about their tasks.
      
      USER CONTEXT:
      The user currently has the following tasks:
      ${JSON.stringify(mockTasks, null, 2)}

      GUIDELINES:
      - Only answer questions related to task management, the user's current tasks, or general support for this website.
      - If a user asks something unrelated, politely decline and steer the conversation back to their tasks or the website.
      - Be concise, professional, and helpful.
      - If a user asks what they should do next, suggest a pending task based on their list.
    `;

        // 4. Test Question
        const userMessage = "What tasks do I have pending and what should I work on next?";
        console.log("\nUser Question:", userMessage);

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser Message:\n" + userMessage }] }]
        });

        const responseText = result.response.text();
        console.log("\n--- AI RESPONSE ---");
        console.log(responseText);
        console.log("-------------------");

    } catch (error) {
        console.error("Test Error:", error.message);
    }
}

testChatbotAccuracy();
