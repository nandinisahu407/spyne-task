const mongoose=require('mongoose');

const discussionSchema=new mongoose.Schema({
    
    user:{
        type: mongoose.Types.ObjectId,
        ref:"User",
        required:true
    },
    text:{
        type:String,
        required:true
    },
    image:{
        type:String,
    },

    hashtags:[{type:String}],
    createdAt:{
        type:Date,
        default: Date.now
    },

    likes:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],

    comments:[{
        user:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
        text:{type:String, required:true},
        likes:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
        replies:[{
            user:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
            text:{type:String, required:true},
            likes:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
        }]

    }]


});

module.exports= mongoose.model("Discussion",discussionSchema);