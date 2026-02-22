import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = useCallback((message, type = "info") => {
        const newNote = {
            id: Date.now(),
            message,
            type,
            time: new Date(),
        };
        setNotifications((prev) => [newNote, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
    }, []);

    const markAllRead = () => setUnreadCount(0);

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
