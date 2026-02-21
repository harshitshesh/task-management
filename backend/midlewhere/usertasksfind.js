
const jwt  = require("jsonwebtoken");
const Userdata = require("../models/Userdata");

 const usertasksprotect = async (req,res,next)=>{

try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    const decode = jwt.verify(token, process.env.JWT_TOKEN);

    req.user = await Userdata.findById(decode.id).select("-password");

    next();

  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed",msg:error.message });
  }

}

module.exports = {usertasksprotect}