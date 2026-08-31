const Faculty = require('../models/Faculty');

exports.createFaculty = async (req,res)=>{
    try{
        const {name} = req.body;
        
        const existFaculty = await Faculty.findOne({name});

        if(existFaculty){
            return res.status(400).json({message:'Faculty already exist'});
        }

        const faculty = await Faculty.create({
            name:name
        });

        res.status(201).json({message:'Faculty added successfully'});
    }catch(error){
        console.error('Create Faculty Error: ',error);
        res.status(500).json({message:'Internal Server Error'});
    }
}

exports.getFaculty = async(req,res)=>{
    try{
        const faculty =await Faculty.find({}).lean();

        res.status(200).json({faculty});

    }catch(error){
        console.error('Get faculty error: ',error);
        res.status(500).json({message:'Internal server error'});
    }
}


exports.deleteFaculty = async(req,res)=>{
    try{
        const {id} = req.params;
        const faculty = await Faculty.findByIdAndDelete(id);

        if(!faculty){
            return res.status(404).json({message:'Faculty not found'});
        }

        res.status(200).json({message:'Faculty is deleted'});
    }catch(error){
        console.error('Delete faculty error: ',error);
        res.status(500).json({message:'Internal Server Error'});
    }
}