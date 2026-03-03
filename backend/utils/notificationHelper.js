const { Resend } = require("resend");
const axios = require("axios");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
    try {
        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("re_your_api_key")) {
            console.warn("⚠️ Resend API Key not configured in .env. Skipping email.");
            return;
        }

        const fromEmail = process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("gmail.com")
            ? process.env.EMAIL_FROM
            : "onboarding@resend.dev";

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [to],
            subject: subject,
            text: text,
        });

        if (error) {
            console.error("❌ Resend Error (Email failed):", error.message);
            if (error.message.includes("domain is not verified")) {
                console.error("💡 TIP: You MUST use 'onboarding@resend.dev' or verify your domain on resend.com.");
            }
            return;
        }

        console.log(`Email sent successfully to ${to} (ID: ${data.id})`);
    } catch (error) {
        console.error("❌ Unexpected Error in sendEmail:", error.message);
    }
};

const sendSlackMessage = async (message) => {
    try {
        if (!process.env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL.includes("Txxx/Bxxx/Xxxx")) {
            console.warn("⚠️ Slack Webhook URL not configured in .env. Skipping Slack notification.");
            return;
        }
        await axios.post(process.env.SLACK_WEBHOOK_URL, { text: message });
        console.log("Slack notification sent");
    } catch (error) {
        console.error("❌ Slack Error (Webhook failed):", error.response ? error.response.data : error.message);
        console.error("💡 TIP: Verify your Slack Webhook URL in .env is complete and correct.");
    }
};

exports.sendReminderNotification = async (task, user, type) => {
    const message = type === "tomorrow"
        ? `Reminder: Your task "${task.title}" is due tomorrow!`
        : `Final Reminder: Your task "${task.title}" is due TODAY!`;

    if (user.email) await sendEmail(user.email, "Task Reminder", message);
    await sendSlackMessage(`Notification for ${user.username}: ${message}`);
};

exports.sendTaskCompletionNotification = async (task, user) => {
    const message = `Congratulations! You've completed the task: "${task.title}".`;

    if (user.email) await sendEmail(user.email, "Task Completed", message);
    await sendSlackMessage(`Notification for ${user.username}: ${message}`);
};

exports.sendTaskExpiryNotification = async (task, user, type) => {
    const message = type === "imminent"
        ? `Reminder: Your task "${task.title}" is due in 1 minute! ⏳`
        : `Alert: The deadline for your task "${task.title}" has been reached! ⚠️`;

    const subject = type === "imminent" ? "Task Due Soon" : "Task Deadline Reached";

    if (user.email) await sendEmail(user.email, subject, message);
    await sendSlackMessage(`Notification for ${user.username}: ${message}`);
};
