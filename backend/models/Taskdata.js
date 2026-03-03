const { default: mongoose } = require("mongoose")


const taskschema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Userdata",
        required: true
    },
    expiryNotificationSent: {
        type: Boolean,
        default: false
    },
    nearExpiryNotificationSent: {
        type: Boolean,
        default: false
    },
    alarmEnabled: {
        type: Boolean,
        default: false
    }

})

module.exports = mongoose.model("taskdata", taskschema)