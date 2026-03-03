const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Taskdata = require('./models/Taskdata');

async function resetFlags() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const result = await Taskdata.updateMany(
            { completed: false },
            { $set: { expiryNotificationSent: false, nearExpiryNotificationSent: false } }
        );
        console.log(`Reset flags for ${result.modifiedCount} pending tasks.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetFlags();
