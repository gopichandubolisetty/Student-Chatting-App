const courseSchema = new mongoose.Schema({
    subjectName :{type:String,required:true},
    slots:[{
        slotName:String,
        facultyName:String,
        roomId :{type:String,unique:true}
    }]
});