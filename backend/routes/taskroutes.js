
const express = require("express")
const { gettasks, gettask, createtask, updatetask, deletetask } = require("../controllers/taskscontroller")

const taskroute = express.Router()


taskroute.get("/tasks",gettasks)

taskroute.get("/task/:id",gettask)

taskroute.post("/addt",createtask)

taskroute.put("/updatet/:id",updatetask)

taskroute.delete("/deletet/:id",deletetask)

module.exports = taskroute