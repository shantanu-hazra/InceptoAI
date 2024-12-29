const mongoose = require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");


const resultSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  date:{
    type: Date,
    required: true,
  },
  topic:{
    type: String,
    required: true,
  }
});

module.exports=mongoose.model("result",resultSchema);