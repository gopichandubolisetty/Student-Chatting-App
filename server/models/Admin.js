const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: {type:String , required:true , unique:true,lowercase:true},
    role:{type:String,default:'admin'},
    otp:{type:String},
    otpExpires:{type:Date}}, {timestamps:true});

module.exports = mongoose.model('Admin',adminSchema);