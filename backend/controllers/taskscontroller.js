const Taskdata = require("../models/Taskdata")



exports.gettasks = async (req,res)=>{
    try{
        const tasks = await Taskdata.find({user: req.user._id});
        res.status(200).json(tasks)
    }catch(err){
        res.status(500).json({message:err.message})
    }
};


exports.gettask = async (req,res)=>{
    try{
        const task = await Taskdata.findById(req.params.id);

        if(!task){
            return res.status(404).json({message:"Task not found"})
        }
        res.status(200).json(task)
    }catch(err){
        res.status(500).json({message: err.message})
    }
};


exports.createtask = async (req,res)=>{
    const {title,description,completed}= req.body;

    if(!title || !description){
        return res.status(400).json({message:"Please fill your task info"})
    }
    try{

        const task = await Taskdata.create({
            title,
            description,
            completed,
            user:req.user._id
        })
        res.status(201).json(task)



    }catch(err){
        res.status(500).json({message:err.message})
    }
}




exports.updatetask = async (req,res)=>{
    try{
        const task = await Taskdata.findById(req.params.id)
        if(!task){
            return res.status(404).json({message: "Task is not in your list of tasks"})
        }

        const updatedtask = await Taskdata.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true}
        )

        res.status(200).json(updatedtask)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}




exports.deletetask = async (req,res)=>{
    try{
        const task = await Taskdata.findById(req.params.id);
        if(!task){
            return res.status(404).json({message:"your task is not found"})
        }

        await Taskdata.deleteOne()

        res.status(200).json({message:"task Deleted "})
    }catch(err){
        res.status(500).json({message:err.message})
    }
}