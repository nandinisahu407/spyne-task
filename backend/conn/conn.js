require('dotenv').config();
const mongoose=require('mongoose');

const conn=async(req,res)=>{
    try {
        
        await mongoose.connect(process.env.MONGODB_URI)
        .then(()=>{
            console.log("Connected successfully to mongodb");
        });
        
    } catch (error) {
        res.status(400).json({message:"Not connected"});
    }
   

}

conn();