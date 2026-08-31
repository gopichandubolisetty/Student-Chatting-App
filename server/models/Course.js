const mongoose = requrie('mongoose');

const courseSchema = new mongoose.Schema({
    name:{type:String,required:true},
    code:{type:String,required:true,unique:true},
    semester:{type:String,required:true}
},{timestamps:true});

module.exports = mongoose.model('Course',courseSchema);