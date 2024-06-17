const express= require('express');
const app= express();
require('./conn/conn');
const auth=require('./routes/auth');
const post=require('./routes/post');
const multer=require('multer');

const cors=require("cors");
require('dotenv').config();

const cookieParser=require('cookie-parser');

app.use(cors(
    {
        origin:"*",
        methods:["POST","GET","DELETE","PUT"],
        credentials:true
    }
));

app.use(express.json());
app.use(auth);
app.use(post);

app.use(cookieParser());

app.use('/uploads',express.static('uploads'));

app.get("/",(req,res)=>{
    res.send("Hello Nandini");
})


app.listen(1000,()=>{
    console.log("server listening at 1000");
})