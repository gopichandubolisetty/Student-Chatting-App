const Course = require('../models/Course');
const Room = require('../models/Room');

exports.createCourse = async (req,res)=>{
    try{
        const {name,code,semester} = req.body;
        const existingCourse =await Course.findOne({code:code.toUpperCase()});
        if(existingCourse){
            return res.status(400).json({message: ' Course already exisited'});
        }

        const course = await Course.create({
            name,
            code:code.toUpperCase(),
            semester
        });
        
        res.status(201).json({message:'Course created Successfully',course});
    }catch(error){
        console.error('Create course error: ',error);
        res.status(500).json({message: 'Internal server error'});
    }
}

exports.getCourse = async(req,res)=>{
    try{
        const course = await Course.find({}).lean();
        res.status(200).json({course});
    }catch(error){
        console.error('Get courses error: ',error);
        res.status(500).json({message:'Internal Server Error'});
    }
}

exports.deleteCourse = async (req,res)=>{
    try{
        const { id } = req.params;
        const course = await Course.findByIdAndDelete(id);
        if(!course){
            return res.status(404).json({message: 'Course Not found'});
        }

        await Room.deleteMany({ courseId: id });
        res.status(200).json({message:'Course deleted Successfully'});
    }catch(error){
        console.error('Error Deleting error: ',error);
        res.status(500).json({message:'Internal Server Error'});
    }
}

