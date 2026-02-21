import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
    getTasksApi,
    createTaskApi,
    updateTaskApi,
    deleteTaskApi,
} from "../api/taskApi";

const FILTERS = ["All", "Pending", "Completed"];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", completed: false });
    const [saving, setSaving] = useState(false);

    const fetchTasks = async () => {
        try {
            const data = await getTasksApi();
            if (Array.isArray(data)) setTasks(data);
            else addToast(data.message || "Failed to load tasks", "error");
        } catch {
            addToast("Server error fetching tasks", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const openCreate = () => {
        setEditTask(null);
        setForm({ title: "", description: "", completed: false });
        setShowModal(true);
    };

    const openEdit = (task) => {
        setEditTask(task);
        setForm({ title: task.title, description: task.description, completed: task.completed });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditTask(null); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editTask) {
                const data = await updateTaskApi(editTask._id, form);
                if (data._id) {
                    setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
                    addToast("Task updated successfully ✏️", "success");
                    closeModal();
                } else addToast(data.message || "Update failed", "error");
            } else {
                const data = await createTaskApi(form);
                if (data._id) {
                    setTasks((prev) => [...prev, data]);
                    addToast("Task created! 🎯", "success");
                    closeModal();
                } else addToast(data.message || "Create failed", "error");
            }
        } catch {
            addToast("Server error. Try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (task) => {
        try {
            const data = await updateTaskApi(task._id, { ...task, completed: !task.completed });
            if (data._id) {
                setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
                addToast(data.completed ? "Task marked complete ✅" : "Task marked pending ⏳", "success");
            } else addToast(data.message || "Update failed", "error");
        } catch {
            addToast("Server error", "error");
        }
    };

    const handleDelete = async () => {
        try {
            const data = await deleteTaskApi(deleteId);
            setTasks((prev) => prev.filter((t) => t._id !== deleteId));
            addToast("Task deleted 🗑️", "success");
        } catch {
            addToast("Delete failed", "error");
        } finally {
            setDeleteId(null);
        }
    };

    const handleLogout = () => {
        logout();
        addToast("Logged out successfully. See you soon! 👋", "info");
        navigate("/login");
    };

    const filtered = tasks.filter((t) => {
        if (filter === "Pending") return !t.completed;
        if (filter === "Completed") return t.completed;
        return true;
    });
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;

    return (
        <div className="dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-logo">
                    <span className="logo-icon-sm">⚡</span>
                    <span>TaskFlow</span>
                </div>
                <div className="nav-right">
                    <div className="nav-user">
                        <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
                        <span>{user?.username}</span>
                    </div>
                    <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
                </div>
            </nav>

            <main className="main-content">
                {/* Hero Section */}
                <div className="hero-section">
                    <h2>Good day, <span className="gradient-text">{user?.username}</span> 👋</h2>
                    <p>Here's your task overview for today</p>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card stat-total">
                        <div className="stat-icon">📋</div>
                        <div className="stat-info">
                            <span className="stat-num">{tasks.length}</span>
                            <span className="stat-label">Total Tasks</span>
                        </div>
                    </div>
                    <div className="stat-card stat-pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <span className="stat-num">{pending}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>
                    <div className="stat-card stat-done">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <span className="stat-num">{completed}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="tasks-section">
                    <div className="tasks-header">
                        <div className="filter-tabs">
                            {FILTERS.map((f) => (
                                <button
                                    key={f}
                                    className={`filter-tab ${filter === f ? "active" : ""}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                    <span className="tab-count">
                                        {f === "All" ? tasks.length : f === "Pending" ? pending : completed}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button className="btn-add" onClick={openCreate}>
                            <span>+</span> New Task
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loader" />
                            <p>Loading tasks...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No tasks here</h3>
                            <p>{filter === "All" ? "Create your first task to get started!" : `No ${filter.toLowerCase()} tasks`}</p>
                            {filter === "All" && (
                                <button className="btn-primary" onClick={openCreate}>Create Task</button>
                            )}
                        </div>
                    ) : (
                        <div className="tasks-grid">
                            {filtered.map((task) => (
                                <div key={task._id} className={`task-card ${task.completed ? "completed" : ""}`}>
                                    <div className="task-card-top">
                                        <button
                                            className={`check-btn ${task.completed ? "checked" : ""}`}
                                            onClick={() => handleToggle(task)}
                                            title="Toggle complete"
                                        >
                                            {task.completed ? "✓" : ""}
                                        </button>
                                        <div className="task-meta">
                                            <span className={`badge ${task.completed ? "badge-done" : "badge-pending"}`}>
                                                {task.completed ? "Completed" : "Pending"}
                                            </span>
                                            <span className="task-date">
                                                {new Date(task.created).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="task-title">{task.title}</h3>
                                    <p className="task-desc">{task.description}</p>
                                    <div className="task-actions">
                                        <button className="btn-edit" onClick={() => openEdit(task)}>✏️ Edit</button>
                                        <button className="btn-delete" onClick={() => setDeleteId(task._id)}>🗑️ Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editTask ? "Edit Task" : "Create New Task"}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter task title..."
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="Describe the task..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    required
                                    rows={4}
                                />
                            </div>
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    id="completed"
                                    checked={form.completed}
                                    onChange={(e) => setForm({ ...form, completed: e.target.checked })}
                                />
                                <label htmlFor="completed">Mark as completed</label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className={`btn-primary ${saving ? "loading" : ""}`} disabled={saving}>
                                    {saving ? <span className="spinner" /> : editTask ? "Save Changes" : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete Task?</h2>
                            <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
                        </div>
                        <p className="confirm-text">This action cannot be undone. Are you sure?</p>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
