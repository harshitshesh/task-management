const jwt  = require("jsonwebtoken");
const Userdata = require("../models/Userdata");


const genratejwttoken = (id)=>{
    return jwt.sign({id},process.env.JWT_TOKEN,{
        expiresIn:"30d"
    })


}



exports.signup = async (req,res)=>{
 

    const {username,email,password} =  req.body;

   


    try{
        const userexists = await Userdata.findOne({email})
        if(userexists){
            return res.status(400).json({message:"User already exists"})

        }

        const user = await Userdata.create({
            
            username,
            email,
            password,
        })

        if(user){
           
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: genratejwttoken(user._id),
            })
        }else{
            res.status(400).json({message:"Invalid user data"})
        }
    }catch(err){
        res.status(500).json({message: err.message})
    }
}



exports.login = async (req,res)=>{
    const {email,password}= req.body;
  

    try{
        const user = await Userdata.findOne({email})
        
        if(user && (await user.matchPassword(password))){
            res.json({
                _id: user._id,
                username:user.username,
                
                email:user.email,
                token: genratejwttoken(user._id)
            })
        }else{
            res.status(401).json({message:"Invalid email and password"})
        }
    }catch(err){
        res.status(500).json({message:err.message})
    }
}