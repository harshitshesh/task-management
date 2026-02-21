const { default: mongoose } = require("mongoose")


const taskschema = new mongoose.Schema({

    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    completed:{
        type:Boolean,
        default:false
    },
    created:{
        type:Date,
        default:Date.now
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Userdata",
        required:true
    }

})

module.exports = mongoose.model("taskdata",taskschema)