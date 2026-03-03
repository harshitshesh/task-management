const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Taskdata = require('./models/Taskdata');

async function checkTasks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const tasks = await Taskdata.find({ completed: false }).sort({ dueDate: -1 }).limit(5);
        console.log("Recent Pending Tasks:");
        tasks.forEach(t => {
            console.log(`Title: ${t.title}`);
            console.log(`Due: ${t.dueDate}`);
            console.log(`ExpiryNotif: ${t.expiryNotificationSent}`);
            console.log(`NearExpiryNotif: ${t.nearExpiryNotificationSent}`);
            console.log('---');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTasks();
