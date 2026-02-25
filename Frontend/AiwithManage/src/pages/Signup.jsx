import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupApi } from "../api/taskApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

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
                        <div className="logo-icon">⚡</div>
                        <h1>TaskFlow</h1>
                        <p>Create your free account</p>
                    </div>
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <span className="input-icon">👤</span>
                            <input
                                type="text"
                                placeholder="Username"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <span className="input-icon">✉</span>
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
                    <div className="visual-element el-1">✨ Join the elite</div>
                    <div className="visual-element el-2">🚀 Faster Workflow</div>
                    <div className="visual-image">
                        <span style={{ fontSize: '150px' }}>⚡</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
