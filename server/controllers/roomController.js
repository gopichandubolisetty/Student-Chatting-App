const Room = require('../models/Room');

exports.joinOrCreateRoom = async (req,res)=>{
    try{
        const {courseId,facultyId,slotId} = req.body;

        if(!courseId || !facultyId || !slotId){
            return res.status(400).json({message:'Course, Faculty, and slot IDs are required.'});
        }

        let room = Room.findOne({
            courseId,
            facultyId,
            slotId
        });

        if(!room){
            room = Room.create({
                courseId,
                facultyId,
                slotId
            });
        }

        res.status(200).json(
            {message:'Room accessed successfully',
            roomId:room._id;
            });
    }catch(error){

        if(error.code==11000){
            console.error('Race condition mitigated by unique index');
            res.status(500).json({message:'Room creation collision. Please try again.'});
        }
        console.error(' Room Join Error');
        res.status(500).json({message:'Internal server error'});
    }
}