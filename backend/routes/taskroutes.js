
const express = require("express")
const { gettasks, gettask, createtask, updatetask, deletetask } = require("../controllers/taskscontroller")
const { usertasksprotect } = require("../midlewhere/usertasksfind")

const taskroute = express.Router()


taskroute.get("/tasks",usertasksprotect,gettasks)

taskroute.get("/task/:id",gettask)

taskroute.post("/addt",usertasksprotect,createtask)

taskroute.put("/updatet/:id",updatetask)

taskroute.delete("/deletet/:id",deletetask)

module.exports = taskroute