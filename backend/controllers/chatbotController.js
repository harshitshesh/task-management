const { GoogleGenerativeAI } = require("@google/generative-ai");
const Taskdata = require("../models/Taskdata");

exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // 1. Fetch user's tasks for context (The "R" in RAG)
        const tasks = await Taskdata.find({ user: req.user._id });

        // Format tasks for context
        const taskContext = tasks.map(t => ({
            title: t.title,
            description: t.description,
            status: t.completed ? "Completed" : "Pending",
            created: t.created
        }));
        // 2. Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // 3. Construct System Prompt
        const systemPrompt = `
      You are an AI assistant for a "Task" management website.
      Your primary goal is to help users manage their tasks and answer questions about their tasks.
      
      USER CONTEXT:
      The user currently has the following tasks:
      ${JSON.stringify(taskContext, null, 2)}

      GUIDELINES:
      - Only answer questions related to task management, the user's current tasks, or general support for this website.
      - If a user asks something unrelated, politely decline and steer the conversation back to their tasks or the website.
      - Be concise, professional, and helpful.
      - If a user asks what they should do next, suggest a pending task based on their list.
    `;

        // 4. Generate Response
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: systemPrompt + "\n\nUser Message:\n" + message
                        }
                    ]
                }
            ]
        });
        const text = result.response.text();

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ message: "Something went wrong with the AI assistant", error: error.message });
    }
};
