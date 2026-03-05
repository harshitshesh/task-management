self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "Task Reminder";
    const options = {
        body: data.body || "A task is due soon!",
        icon: data.icon || "/tasklogo.png",
        badge: "/tasklogo.png",
        data: {
            url: data.data?.url || "/dashboard"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
