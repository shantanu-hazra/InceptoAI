const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");


const userSchema=mongoose.Schema({
  username:{
    type:String,
    required:true,
  },
  email:{
    type:String,
    required:true,
    unique:true
  },
  results:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"result",
  }],
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports=mongoose.model("user",userSchema);