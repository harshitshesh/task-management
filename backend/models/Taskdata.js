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
    }

})

module.exports = mongoose.model("taskdata",taskschema)