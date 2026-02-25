require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { dbconnect } = require("./config/db")

const app = express()

app.use(cors())
app.use(express.json())

const authroute = require("./routes/userroutes")
const taskroute = require("./routes/taskroutes")
const chatbotroute = require("./routes/chatbotRoutes")

app.use("/api/auth", authroute)
app.use("/api/taskmanage", taskroute)
app.use("/api/chatbot", chatbotroute)

app.get("/", (req, res) => {
  res.send("server start..")
})

const port = process.env.PORT || 4000

dbconnect().then(() => {
  app.listen(port, () => {
    console.log("server start")
  })
})