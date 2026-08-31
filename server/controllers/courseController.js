const Course = require('../models/Course');

exports.createCourse = async (req,res)=>{
    try{
        const {name,code,semester} = req.body;
        const existingCourse =await Course.findOne({code:code.toLowerCase()});
        if(!existingCourse){
            return res.status(401).json({message: ' Course already exisited'});
        }

        const course = await Course.create({
            name,
            code:code.toUpperCase(),
            semester
        });
        
        res.status(200).json({message:'Course created Successfully',course});
    }catch(error){
        console.error('Create course error: ',error);
        res.status(500).json({message: 'Internal server error'});
    }
}