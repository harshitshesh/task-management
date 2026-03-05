const { default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs")



const userschema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createat: {
        type: Date,
        default: Date.now
    },
    pushSubscription: {
        type: Object,
        default: null
    }
})


userschema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)

})


userschema.methods.matchPassword = async function (enterpassword) {

    return await bcrypt.compare(enterpassword, this.password)
}



module.exports = mongoose.model("Userdata", userschema)