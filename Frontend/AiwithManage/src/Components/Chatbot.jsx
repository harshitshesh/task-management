import { useState, useRef, useEffect } from "react";
import { chatbotApi } from "../api/taskApi";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';



export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I'm your Taskyn AI assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const data = await chatbotApi(userMsg);
            if (data.reply) {
                setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to service." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`chatbot-container ${isOpen ? "open" : ""}`}>
            {!isOpen && (
                <button className="chat-bubble" onClick={() => setIsOpen(true)}>
                    <span className="chat-icon"><DotLottieReact className="w-36"  src="/Chatbotanimation.lottie"
      loop
      autoplay/></span>
                </button>
            )}

            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <span className="chat-avatar"><img src="/ai-assistant.png" alt="" /></span>
                            <div>
                                <h3>Taskyn AI</h3>
                                <p>Online </p>
                            </div>
                        </div>
                        <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.role}`}>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message assistant loading">
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form className="chat-input" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Ask about your tasks..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            {loading ? "..." : "➤"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
