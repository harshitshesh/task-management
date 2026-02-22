import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import {
    getTasksApi,
    createTaskApi,
    updateTaskApi,
    deleteTaskApi,
} from "../api/taskApi";
import Sidebar from "../Components/Sidebar";
import Pagination from "../Components/Pagination";

const STATUS_FILTERS = ["All", "Pending", "Completed"];
const ITEMS_PER_PAGE = 8;

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
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

    // Derived counts
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;
    const completionPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    // Filtered + searched tasks
    const filtered = useMemo(() => {
        let result = tasks;
        if (filter === "Pending") result = result.filter((t) => !t.completed);
        if (filter === "Completed") result = result.filter((t) => t.completed);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    (t.description && t.description.toLowerCase().includes(q))
            );
        }
        return result;
    }, [tasks, filter, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when filter/search changes
    useEffect(() => { setCurrentPage(1); }, [filter, searchQuery]);

    // Highlight matched text
    const highlight = (text, query) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        return text.split(regex).map((part, i) =>
            regex.test(part) ? <mark key={i} className="highlight">{part}</mark> : part
        );
    };

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
                    addNotification("Task updated: " + form.title, "success");
                    closeModal();
                } else addToast(data.message || "Update failed", "error");
            } else {
                const data = await createTaskApi(form);
                if (data._id) {
                    setTasks((prev) => [...prev, data]);
                    addToast("Task created! 🎯", "success");
                    addNotification("New task created: " + form.title, "create");
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
                const msg = data.completed ? "Task marked complete ✅" : "Task marked pending ⏳";
                addToast(msg, "success");
                addNotification(msg + ": " + task.title, data.completed ? "success" : "info");
            } else addToast(data.message || "Update failed", "error");
        } catch {
            addToast("Server error", "error");
        }
    };

    const handleDelete = async () => {
        const task = tasks.find((t) => t._id === deleteId);
        try {
            await deleteTaskApi(deleteId);
            setTasks((prev) => prev.filter((t) => t._id !== deleteId));
            addToast("Task deleted 🗑️", "success");
            addNotification("Task deleted: " + (task?.title || ""), "delete");
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

    return (
        <div className="app-layout">
            <Sidebar user={user} onLogout={handleLogout} onNewTask={openCreate} />

            <div className="dashboard">
                {/* Background Orbs */}
                <div className="dash-orbs" aria-hidden="true">
                    <div className="dash-orb dash-orb-1" />
                    <div className="dash-orb dash-orb-2" />
                    <div className="dash-orb dash-orb-3" />
                </div>

                <main className="main-content">
                    {/* Hero */}
                    <div className="hero-section">
                        <h2>Good day, <span className="gradient-text">{user?.username}</span> 👋</h2>
                        <p>Here's your task overview for today</p>
                    </div>

                    {/* Stats — compact scrollable row */}
                    <div className="stats-track-wrapper">
                        <div className="stats-track">
                            <div className="stat-card stat-total">
                                <div className="stat-icon-3d">📋</div>
                                <div className="stat-info">
                                    <span className="stat-num">{tasks.length}</span>
                                    <span className="stat-label">Total Tasks</span>
                                </div>
                            </div>
                            <div className="stat-card stat-pending">
                                <div className="stat-icon-3d">⏳</div>
                                <div className="stat-info">
                                    <span className="stat-num">{pending}</span>
                                    <span className="stat-label">Pending</span>
                                </div>
                            </div>
                            <div className="stat-card stat-done">
                                <div className="stat-icon-3d">✅</div>
                                <div className="stat-info">
                                    <span className="stat-num">{completed}</span>
                                    <span className="stat-label">Completed</span>
                                </div>
                            </div>
                            {/* Progress card */}
                            <div className="stat-card stat-progress">
                                <div className="stat-icon-3d">📈</div>
                                <div className="stat-info stat-info-wide">
                                    <div className="stat-progress-row">
                                        <span className="stat-num">{completionPct}%</span>
                                        <span className="stat-label">Done</span>
                                    </div>
                                    <div className="progress-bar-track">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${completionPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div className="tasks-section">
                        <div className="tasks-header">
                            <div className="tasks-header-top">
                                <div className="filter-tabs">
                                    {STATUS_FILTERS.map((f) => (
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

                            {/* Search Bar */}
                            <div className="search-bar-wrapper">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    className="search-bar"
                                    placeholder="Search tasks by title or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
                                )}
                            </div>

                            {/* Results info */}
                            {(searchQuery || filter !== "All") && (
                                <p className="results-info">
                                    Showing <strong>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}
                                    {searchQuery && <> for "<em>{searchQuery}</em>"</>}
                                    {filter !== "All" && <> · <strong>{filter}</strong></>}
                                </p>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="loader" />
                                <p>Loading tasks...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">{searchQuery ? "🔍" : "📭"}</div>
                                <h3>{searchQuery ? "No results found" : "No tasks here"}</h3>
                                <p>
                                    {searchQuery
                                        ? `No tasks match "${searchQuery}"`
                                        : filter === "All"
                                            ? "Create your first task to get started!"
                                            : `No ${filter.toLowerCase()} tasks`}
                                </p>
                                {!searchQuery && filter === "All" && (
                                    <button className="btn-primary" onClick={openCreate}>Create Task</button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="tasks-grid">
                                    {paginated.map((task, index) => (
                                        <div
                                            key={task._id}
                                            className={`task-card ${task.completed ? "completed" : ""}`}
                                            style={{ animationDelay: `${index * 0.06}s` }}
                                        >
                                            <div className="task-card-3d-inner">
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
                                                            {new Date(task.created).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3 className="task-title">
                                                    {highlight(task.title, searchQuery)}
                                                </h3>
                                                <p className="task-desc">
                                                    {highlight(task.description || "", searchQuery)}
                                                </p>
                                                <div className="task-actions">
                                                    <button className="btn-edit" onClick={() => openEdit(task)}>✏️ Edit</button>
                                                    <button className="btn-delete" onClick={() => setDeleteId(task._id)}>🗑️ Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}
                    </div>
                </main>
            </div>

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
