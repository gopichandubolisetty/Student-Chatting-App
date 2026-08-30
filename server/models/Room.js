const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    subjectId:{type:mongoose.Schema.Types.ObjectId, ref:'Subject',required:true},
    facultyId:{type:mongoose.Schema.Types.ObjectId, ref:'Faculty',required:true},
    slotId:{type:mongoose.Schema.Types.ObjectId,ref:'Slot',requried:true},
    isActive:{type :Boolean, default:ture}},{timestamps:true});

roomSchema.index({subjectId:1 , facultyId:1, slotId:1},{unique:true});

module.exports = mongoose.model('Room',roomSchema);