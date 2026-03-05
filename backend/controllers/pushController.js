const Userdata = require("../models/Userdata");

exports.saveSubscription = async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription) {
            return res.status(400).json({ message: "Subscription is required" });
        }

        await Userdata.findByIdAndUpdate(req.user._id, {
            pushSubscription: subscription
        });

        res.status(200).json({ message: "Subscription saved successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
