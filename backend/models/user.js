const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    
    mobno:{
        type:String,
        required:true,
        unique:true,
        validate: {
            validator: function(v) {
              return /^\d{10}$/.test(v); //validation for a 10-digit mobile number
            },
            message: props => `${props.value} is not a valid mobile number!`
        }
    },

    email:{
        type:String,
        required:true,
        unique:true,
        match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    password:{
        type:String,
        required:true
    },

    followers:[{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }],

    following:[{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }],

});

module.exports= mongoose.model("User",userSchema);