const mongoose = require('mongoose');

const slotSchema = mongoose.Schema({
    name:{type:String,required:true},
    type:{type:String,enum:['theory','lab','project'],default:theory}
},{timestamps:true});

module.exports =  mongoose.model('Slot',slotSchema);