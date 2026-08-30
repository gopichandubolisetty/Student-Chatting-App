const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId:{type:mongoose.Schema.Types.ObjectId,ref:'Room',required:true},
    senderId:{type:mongoose.Schema.Types.ObjectId,required:true,refPath:'senderModel'},
    senderModel:{type:String,required:true,enum:['Admin','Student']},
    content:{type:String,required:true},
    messageType:{type:String,enum:['text','image']},
    fileUrl:{type:String}},{timestamps:true
});

module.exports = mongoose.model('Message',messageSchema);