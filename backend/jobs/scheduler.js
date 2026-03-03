const cron = require("node-cron");
const Taskdata = require("../models/Taskdata");
const notificationHelper = require("../utils/notificationHelper");

const startScheduler = () => {
    // Runs daily at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
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
            const oneMinFromNow = new Date(now.getTime() + 60000);

            // 1. Tasks expiring in the next minute (Near Expiry)
            const nearExpiryTasks = await Taskdata.find({
                dueDate: { $gt: now, $lte: oneMinFromNow },
                completed: false,
                nearExpiryNotificationSent: { $ne: true }
            }).populate("user");

            for (const task of nearExpiryTasks) {
                console.log(`Sending near-expiry alert for: ${task.title}`);
                await notificationHelper.sendTaskExpiryNotification(task, task.user, "imminent");
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
