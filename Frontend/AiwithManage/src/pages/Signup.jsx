import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupApi } from "../api/taskApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Mail, User } from "lucide-react";

export default function Signup() {
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await signupApi(form);
            if (data.token) {
                login(data);
                addToast(`Account created! Welcome, ${data.username} 🎉`, "success");
                navigate("/dashboard");
            } else {
                addToast(data.message || "Signup failed", "error");
            }
        } catch {
            addToast("Server error. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page auth-page-split">
            <div className="auth-left">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="logo-icon"><img className="h-[10vw] w-[10vw] invert"      src="/tasklogo.png" alt="" /></div>
                        <h1>TaskManagement</h1>
                        <p>Create your free account</p>
                    </div>
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <span className="input-icon"><User fill="purple" color="purple"/></span>
                            <input
                                type="text"
                                placeholder="Username"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <span className="input-icon"><Mail size={20} color="gray"/></span>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <span className="input-icon">🔒</span>
                            <input
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className={`btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
                            {loading ? <span className="spinner" /> : "Create Account"}
                        </button>
                    </form>
                    <p className="auth-link">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </p>
                </div>
            </div>
            <div className="auth-right">
                <div className="animated-visual">
                    <div className="visual-element el-1">✨ Plan With AI</div>
                    <div className="visual-element el-2">🚀 Next Level Productivity</div>
                    <div className="visual-image">
                        <span className="absolute m- top-[100%] left-[94%] w-80 " style={{ fontSize: '150px' }}><img className="h-[18vw] w-[18vw] mt-28"  src="/tasksmanage-logo.png" alt="logo image"/></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
