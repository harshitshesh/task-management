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
import Chatbot from "../Components/Chatbot";

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
    const [selectedTask, setSelectedTask] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", completed: false, dueDate: "", alarmEnabled: false });
    const [saving, setSaving] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    useEffect(() => {
        fetchTasks();
        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

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

    // Alarm Engine
    useEffect(() => {
        const checkAlarms = () => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.completed || !task.dueDate || !task.alarmEnabled) return;

                const dueDate = new Date(task.dueDate);
                const diffMs = dueDate - now;
                const diffMins = Math.floor(diffMs / (1000 * 60));

                // 1. Alarm 1 Day Before (within 1-minute window)
                if (diffMins === 1440) { // 24 hours
                    triggerAlarm(`Alarm: Task "${task.title}" is due in 1 day!`);
                }

                // 2. Alarm At Deadline (within 1-minute window)
                if (diffMins === 0) {
                    triggerAlarm(`ALERT: Task "${task.title}" deadline reached! ⚠️`);
                }
            });
        };

        const triggerAlarm = (message) => {
            // Browser Notification
            if (Notification.permission === "granted") {
                new Notification("TaskFlow Alarm", { body: message, icon: "/tasklogo.png" });
            }
            // Audio Alarm
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(e => console.log("Audio play blocked by browser", e));
            addToast(message, "info");
        };

        const interval = setInterval(checkAlarms, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [tasks]);

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
        setForm({ title: "", description: "", completed: false, dueDate: "", alarmEnabled: false });
        setShowModal(true);
    };

    const openEdit = (task) => {
        setEditTask(task);
        setForm({
            title: task.title,
            description: task.description,
            completed: task.completed,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
            alarmEnabled: task.alarmEnabled || false
        });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditTask(null); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Convert local time string from datetime-local to ISO string for the backend
            const payload = {
                ...form,
                dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : ""
            };

            if (editTask) {
                const data = await updateTaskApi(editTask._id, payload);
                if (data._id) {
                    setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
                    addToast("Task updated successfully ✏️", "success");
                    addNotification("Task updated: " + form.title, "success");
                    closeModal();
                } else addToast(data.message || "Update failed", "error");
            } else {
                const data = await createTaskApi(payload);
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
            setTasks((prev) => {
                const updated = prev.filter((t) => t._id !== deleteId);
                // Pagination Fix: If current page becomes empty, go back
                const newFiltered = updated.filter(t => {
                    if (filter === "Pending") return !t.completed;
                    if (filter === "Completed") return t.completed;
                    return true;
                });
                const newTotalPages = Math.ceil(newFiltered.length / ITEMS_PER_PAGE);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                }
                return updated;
            });
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

    const getTimeRemaining = (dueDate) => {
        if (!dueDate) return null;
        const total = Date.parse(dueDate) - Date.now();
        if (total <= 0) return "Time's up! ❌";


        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m ${seconds}s left`;
    };

    // Greeting texts for infinite loop
    const greetings = [
        `Good day, ${user?.username || 'User'} `,
        "Let's crush those tasks! ",
        "Small steps lead to big wins. ",
        "Stay focused and productive. "
    ];
    const [greetingIndex, setGreetingIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setGreetingIndex((prev) => (prev + 1) % greetings.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [greetings.length]);

    // Stats cards for infinite slider
    const statCards = [
        <div key="total" className="stat-card stat-total">
            <div className="stat-icon-3d">📋</div>
            <div className="stat-info">
                <span className="stat-num">{tasks.length}</span>
                <span className="stat-label">Total Tasks</span>
            </div>
        </div>,
        <div key="pending" className="stat-card stat-pending">
            <div className="stat-icon-3d">⏳</div>
            <div className="stat-info">
                <span className="stat-num">{pending}</span>
                <span className="stat-label">Pending</span>
            </div>
        </div>,
        <div key="done" className="stat-card stat-done">
            <div className="stat-icon-3d">✅</div>
            <div className="stat-info">
                <span className="stat-num">{completed}</span>
                <span className="stat-label">Completed</span>
            </div>
        </div>,
        <div key="progress" className="stat-card stat-progress">
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
    ];

    return (
        <div className="app-layout">
            <Sidebar user={user} onLogout={handleLogout} onNewTask={openCreate} />

            <div className={`dashboard ${mobileMenuOpen ? 'mobile-menu-active' : ''}`}>
                {/* Mobile Navbar */}
                <header className="mobile-navbar">
                    <div className="mobile-nav-left flex items-center justify-center">
                        <span className="mb-logo-icon"><img className="w-[50px] invert" src="/tasklogo.png" /></span>

                    </div>
                    <button
                        className="mobile-nav-toggle"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        ☰
                    </button>
                </header>

                {/* Mobile Sidebar Overlay */}
                {mobileMenuOpen && (
                    <div className="mobile-sidebar-overlay" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
                            <button className="mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
                            <Sidebar
                                user={user}
                                onLogout={handleLogout}
                                onNewTask={() => { openCreate(); setMobileMenuOpen(false); }}
                                isMobile={true}
                            />
                        </div>
                    </div>
                )}
                {/* Background Orbs */}
                <div className="dash-orbs" aria-hidden="true">
                    <div className="dash-orb dash-orb-1" />
                    <div className="dash-orb dash-orb-2" />
                    <div className="dash-orb dash-orb-3" />
                </div>

                <main className="main-content">
                    {/* Hero area (Not Sticky) */}
                    <div className="dashboard-hero-area">
                        <div className="stats-header">
                            <div className="hero-section">
                                <div className="hero-greeting-container">
                                    <h2 key={greetingIndex} className="fade-slide-up gradient-text m-0">
                                        {greetings[greetingIndex]}
                                    </h2>
                                </div>
                                <p>Here's your task overview for today</p>
                            </div>
                            <button
                                className={`btn-track ${showStats ? 'active' : ''}`}
                                onClick={() => setShowStats(!showStats)}
                            >
                                {showStats ? 'Hiding' : 'Track'} 🛰️
                            </button>
                        </div>

                        {/* Stats — Infinite Slider Row */}
                        <div className={`stats-track-wrapper ${showStats ? '' : 'hidden'}`}>
                            <div className="stats-slider-container">
                                <div className="stats-track-infinite">
                                    {statCards}
                                    {/* Duplicating cards for infinite effect */}
                                    {statCards}
                                    {statCards}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Header Section (Search & Filters Only) */}
                        <div className="dashboard-sticky-part">
                            {/* Tasks Header (Filter + New + Search) */}
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
                                                <div className="task-card-content">
                                                    <div className="task-card-top">
                                                        <button
                                                            className={`check-btn ${task.completed ? "checked" : ""}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggle(task);
                                                            }}
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
                                                        {!task.completed && task.dueDate && (
                                                            <div className="task-time-left">
                                                                ⏳ {getTimeRemaining(task.dueDate)}
                                                                {task.alarmEnabled && <span className="alarm-icon-mini" title="Alarm Enabled"> 🔔</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="task-card-body">
                                                        <h3 className="task-title">
                                                            {highlight(task.title, searchQuery)}
                                                        </h3>
                                                        <p className="task-desc">
                                                            {highlight(task.description || "", searchQuery)}
                                                        </p>
                                                    </div>

                                                    <div className="task-actions">
                                                        <button className="btn-edit" onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEdit(task);
                                                        }}>✏️ Edit</button>
                                                        <button className="btn-delete" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteId(task._id);
                                                        }}>🗑️ Delete</button>
                                                    </div>
                                                </div>

                                                <div className="task-read-overlay">
                                                    <button
                                                        className="btn-read-task"
                                                        onClick={() => setSelectedTask(task)}
                                                    >
                                                        Read Task 🔍
                                                    </button>
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
            {
                showModal && (
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
                                <div className="form-group">
                                    <label>Deadline (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={form.dueDate}
                                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                        className="modal-date-picker"
                                    />
                                </div>
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        id="alarmEnabled"
                                        checked={form.alarmEnabled}
                                        onChange={(e) => setForm({ ...form, alarmEnabled: e.target.checked })}
                                    />
                                    <label htmlFor="alarmEnabled">🔔 Enable Browser Alarm (Sound + Popup)</label>
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
                )
            }

            {/* Delete Confirm */}
            {
                deleteId && (
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
                )
            }

            {/* Task Details Modal */}
            {
                selectedTask && (
                    <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
                        <div className="modal modal-lg task-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="task-detail-header">
                                    <span className={`badge ${selectedTask.completed ? "badge-done" : "badge-pending"}`}>
                                        {selectedTask.completed ? "Completed" : "Pending"}
                                    </span>
                                    <h2>Task Details</h2>
                                </div>
                                <button className="modal-close" onClick={() => setSelectedTask(null)}>×</button>
                            </div>
                            <div className="task-detail-body">
                                <h1 className="task-detail-title">{selectedTask.title}</h1>
                                <div className="task-detail-info">
                                    <span className="info-item">📅 Created: {new Date(selectedTask.created).toLocaleString()}</span>
                                    {selectedTask.updated && (
                                        <span className="info-item">✏️ Updated: {new Date(selectedTask.updated).toLocaleString()}</span>
                                    )}
                                </div>
                                <div className="task-detail-desc-label">Description</div>
                                <div className="task-detail-description">
                                    {selectedTask.description || "No description provided."}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-primary" onClick={() => setSelectedTask(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Chatbot */}
            <Chatbot />
        </div >
    );
}
