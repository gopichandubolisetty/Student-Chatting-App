const userSchema = new mongoose.Schema({
    googleId:String,
    email:{
        type:String,
        required:true,
        unique:true
    },
    name:String,
    role:{
        type:String,
        enum:['student','admin'],
        default:'student'
    },
    avatar:String
});