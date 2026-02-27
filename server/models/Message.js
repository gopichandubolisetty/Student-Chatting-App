const messageSchema = new mongoose.Schema({
    roomId:String,
    sender:{type:mongoose.Schema.Types.ObjectID,ref:'User'},
    text:String,
    fileUrl:String,
    timeStamp:{type:Date,default:Date.now}
});