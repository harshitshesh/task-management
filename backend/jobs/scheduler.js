const cron = require("node-cron");
const webpush = require("web-push");
const Taskdata = require("../models/Taskdata");
const notificationHelper = require("../utils/notificationHelper");

// Web Push Configuration
webpush.setVapidDetails(
    "mailto:codedecodeai1990@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const startScheduler = () => {
    // Runs daily at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
        // ... (existing daily reminder code remains same)
        console.log("Running Daily Reminders Scheduler...");

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const afterTomorrow = new Date(tomorrow);
            afterTomorrow.setDate(tomorrow.getDate() + 1);

            // 1. Due Tomorrow
            const tasksDueTomorrow = await Taskdata.find({
                dueDate: { $gte: tomorrow, $lt: afterTomorrow },
                completed: false
            }).populate("user");

            for (const task of tasksDueTomorrow) {
                await notificationHelper.sendReminderNotification(task, task.user, "tomorrow");
            }

            // 2. Due Today
            const tasksDueToday = await Taskdata.find({
                dueDate: { $gte: today, $lt: tomorrow },
                completed: false
            }).populate("user");

            for (const task of tasksDueToday) {
                await notificationHelper.sendReminderNotification(task, task.user, "today");
            }

            console.log("Daily Reminders sent successfully.");
        } catch (error) {
            console.error("Error in scheduler:", error);
        }
    });

    // Runs every minute for real-time expiry notifications
    cron.schedule("* * * * *", async () => {
        console.log(`[${new Date().toLocaleTimeString()}] Checking for task deadlines...`);
        try {
            const now = new Date();
            const fiveMinsFromNow = new Date(now.getTime() + 5 * 60000);
            const sixMinsFromNow = new Date(now.getTime() + 6 * 60000);

            // 1. Tasks expiring in exactly 5 minutes (Pre-Expiry Push)
            const preExpiryTasks = await Taskdata.find({
                dueDate: { $gt: fiveMinsFromNow, $lte: sixMinsFromNow },
                completed: false,
                nearExpiryNotificationSent: { $ne: true }
            }).populate("user");

            for (const task of preExpiryTasks) {
                console.log(`Sending 5-min pre-expiry alert for: ${task.title}`);

                // Audio/Popup notification helper (Email/Slack)
                await notificationHelper.sendTaskExpiryNotification(task, task.user, "imminent");

                // Web Push Notification
                if (task.user.pushSubscription) {
                    const payload = JSON.stringify({
                        title: "Task Reminder 🔔",
                        body: `"${task.title}" is due in 5 minutes!`,
                        icon: "/tasklogo.png",
                        data: { url: "/dashboard" }
                    });
                    webpush.sendNotification(task.user.pushSubscription, payload).catch(err => {
                        console.error("Error sending push notification:", err);
                    });
                }

                task.nearExpiryNotificationSent = true;
                await task.save();
            }

            // 2. Tasks already expired
            const expiredTasks = await Taskdata.find({
                dueDate: { $lte: now },
                completed: false,
                expiryNotificationSent: { $ne: true }
            }).populate("user");

            if (expiredTasks.length > 0) {
                console.log(`Sending expiry notifications for ${expiredTasks.length} tasks...`);
                for (const task of expiredTasks) {
                    await notificationHelper.sendTaskExpiryNotification(task, task.user, "expired");

                    // Web Push for expiry
                    if (task.user.pushSubscription) {
                        const payload = JSON.stringify({
                            title: "Deadline Reached! ⚠️",
                            body: `The deadline for "${task.title}" has passed.`,
                            icon: "/tasklogo.png"
                        });
                        webpush.sendNotification(task.user.pushSubscription, payload).catch(err => {
                            console.error("Error sending push notification:", err);
                        });
                    }

                    task.expiryNotificationSent = true;
                    await task.save();
                }
            }
        } catch (error) {
            console.error("Error in real-time scheduler:", error);
        }
    });
};

module.exports = { startScheduler };
