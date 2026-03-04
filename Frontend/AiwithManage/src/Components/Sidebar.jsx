import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { Trash } from 'lucide-react';

const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const typeIcon = (type) => {
    if (type === "success") return "✅";
    if (type === "error") return "❌";
    if (type === "delete") return <Trash fill="white" size={48} color="blue" />;
    if (type === "create") return "🎯";
    return "ℹ️";
};

export default function Sidebar({ user, onLogout, onNewTask, isMobile }) {
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
    const [activePanel, setActivePanel] = useState(null); // null | "notifications"
    const [collapsed, setCollapsed] = useState(false);

    const handleBellClick = () => {
        setActivePanel((p) => (p === "notifications" ? null : "notifications"));
        markAllRead();
    };

    return (
        <>
            {/* Sidebar */}
            <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${isMobile ? "mobile-sidebar-view" : ""}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    {(!collapsed || isMobile) && (
                        <>
                            <span className="sb-logo-icon flex justify-center items-center">

                                <img className="h-[8vw] w-[8vw] invert" src="/tasklogo.png" alt="logo image" />

                            </span>

                        </>
                    )}
                    {collapsed && !isMobile && <span className="sb-logo-icon">  <img className="h-[5vw] w-[5vw]" src="/tasksmanage-logo.png" alt="logo image" />
                    </span>}
                </div>

                {/* Nav Items */}
                <nav className="sidebar-nav">
                    <button className="sb-nav-item active" title="Dashboard">
                        <span className="sb-nav-icon">🏠</span>
                        {(!collapsed || isMobile) && <span className="sb-nav-label">Dashboard</span>}
                    </button>

                    <button className="sb-nav-item" onClick={onNewTask} title="New Task">
                        <span className="sb-nav-icon">➕</span>
                        {(!collapsed || isMobile) && <span className="sb-nav-label">New Task</span>}
                    </button>

                    <button
                        className={`sb-nav-item ${activePanel === "notifications" ? "active" : ""}`}
                        onClick={handleBellClick}
                        title="Notifications"
                    >
                        <span className="sb-nav-icon sb-bell-wrap">
                            🔔
                            {unreadCount > 0 && (
                                <span className="sb-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                            )}
                        </span>
                        {(!collapsed || isMobile) && <span className="sb-nav-label">Notifications</span>}
                    </button>

                    {/* Move mobile items here */}
                    {isMobile && (
                        <>
                            <button className="sb-nav-item sb-theme-mobile" onClick={toggleTheme} title="Toggle theme">
                                <span className="sb-nav-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
                                <span className="sb-nav-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                            </button>

                            {user && (
                                <button className="sb-nav-item sb-logout-mobile" onClick={onLogout} title="Sign Out">
                                    <span className="sb-nav-icon">🚪</span>
                                    <span className="sb-nav-label">Sign Out</span>
                                </button>
                            )}
                        </>
                    )}
                </nav>

                {/* Bottom section - hidden or limited in mobile */}
                {!isMobile && (
                    <div className="sidebar-bottom">
                        {/* Theme Toggle */}
                        <button className="sb-theme-btn" onClick={toggleTheme} title="Toggle theme">
                            <span className="sb-theme-track">
                                <span className={`sb-theme-thumb ${theme === "light" ? "sb-theme-thumb-light" : ""}`}></span>
                            </span>
                            {!collapsed && (
                                <span className="sb-nav-label">{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</span>
                            )}
                        </button>

                        {/* User + Logout */}
                        {user && (
                            <div className="sb-user-section">
                                <div className="sb-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                                {!collapsed && (
                                    <div className="sb-user-info">
                                        <span className="sb-user-name">{user?.username}</span>
                                        <button className="sb-logout-btn" onClick={onLogout}>Sign Out</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Collapse toggle */}
                        <button
                            className="sb-collapse-btn"
                            onClick={() => setCollapsed((c) => !c)}
                            title={collapsed ? "Expand" : "Collapse"}
                        >
                            {collapsed ? "▶" : "◀"}
                        </button>
                    </div>
                )}
            </aside>

            {/* Notifications Panel */}
            {activePanel === "notifications" && (
                <div className="notif-panel">
                    <div className="notif-panel-header">
                        <span>🔔 Notifications</span>
                        <div className="notif-panel-actions">
                            {notifications.length > 0 && (
                                <button className="notif-clear-btn" onClick={clearAll}>Clear all</button>
                            )}
                            <button className="notif-close-btn" onClick={() => setActivePanel(null)}>✕</button>
                        </div>
                    </div>
                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">
                                <span>📭</span>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className={`notif-item notif-${n.type}`}>
                                    <span className="notif-icon">{typeIcon(n.type)}</span>
                                    <div className="notif-body">
                                        <p className="notif-msg">{n.message}</p>
                                        <span className="notif-time">{timeAgo(n.time)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
