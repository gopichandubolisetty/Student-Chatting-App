const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
    googleId : {type:String , required:true , unique:true},
    email : {type:String,required:true,unique:true,lowercase:true},
    name:{type:String , required:true},
    avatar:{type:String}},{timestamps:true});

modules.exports = mongoose.model('Student',studentSchema);

