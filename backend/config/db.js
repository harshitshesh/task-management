const { default: mongoose } = require("mongoose")

 


async function dbconnect(){
try{
await mongoose.connect(process.env.MONGODB_URI)

console.log("db connected")

}catch(err){
    console.log(err)
    console.log(process.env.MONGODB_URI)
    console.log("db not connected")
}
}

module.exports = {dbconnect}

