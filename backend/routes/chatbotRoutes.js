const express = require("express");
const router = express.Router();
const { chatWithAI } = require("../controllers/chatbotController");
const { usertasksprotect } = require("../midlewhere/usertasksfind");

router.post("/chat", usertasksprotect, chatWithAI);

module.exports = router;
