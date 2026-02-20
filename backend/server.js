
const express = require("express")

const cors = require("cors")
const dotenv = require("dotenv")
const { dbconnect } = require("./config/db")
const authroute = require("./routes/userroutes")
const taskroute = require("./routes/taskroutes")
    
const app = express()
dotenv.config()

dbconnect()

const port = process.env.PORT || 4000

app.use(cors())

app.use(express.json())


app.use("/api/auth",authroute)

app.use("/api/taskmanage",taskroute)
app.get("/",(req,res)=>{
    res.send("server start..")
})


app.listen(port,()=>{
    console.log("sever start")
})
