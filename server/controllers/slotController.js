const Slot = require('../models/Slot');

exports.createSlot = async(req,res)=>{
    try{
        const {name,type} = req.body;

        const existslot = await Slot.findOne({name:name});

        if(existslot){
            return res.status(400).json({message:'Slot already registered'});
        }

        const slot = await Slot.create({
            name:name,
            type:type
        });

        res.status(201).json({message:'Created slot successfully'});
    }catch(error){
        console.error('Create slot error',error);
        res.status(500).json({message:'Internal server error'});
    }
}


exports.getSlot = async(req,res)=>{
    try{
        const slot =await Slot.find({}).lean();
        res.status(200).json({slot});
    }catch(error){
        console.error('Get faculty error');
        res.status(500).json({message:'Internal server error'});
    }
}

exports.deleteSlot = async (req,res)=>{
    try{
        const {id} = req.params;
        const slot = await Slot.findByIdAndDelete(id);

        if(!slot){
            return res.status(404).json({message:'Slot not found'});
        }

        res.status(200).json({message:'Slot deleted successfully'});
    }catch(error){
        console.error('Delete slot error',error);
        res.status(500).json({message:'Internal server error'});
    }
}