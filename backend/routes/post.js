const express= require('express');
const router=express.Router();
const multer=require('multer');
const fs=require('fs');
const Discussion=require('../models/discussion');
const User=require('../models/user');
const upload=require("../middleware/upload");

//creatae discussion route
router.post("/postDiscussion",upload.single("image"),async(req,res)=>{
    try {
        const {userId,text,hashtags}=req.body;

        if(!userId){
            return res.status(400).json({message:'UserID is required'});
        }

        if(!text){
            return res.status(400).json({message:'text is required for post'});
        }

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:"User Not found"});
        }

        //create new discussion
        const newDiscussion=new Discussion({
            user:userId,
            text:text,
            hashtags: hashtags? hashtags.split(',').map(tag=>tag.trim()):[],
            image:req.file?req.file.path :null
        });

        await newDiscussion.save();

        res.status(200).json({message:'Discussion posted successfully',newDiscussion});
        
    } catch (error) {
        res.status(500).json({message:'Internal server error'});
    }
})

//get all posts of a user
router.get("/getDiscussion/:id",async(req,res)=>{
    try {
        const existingUser=await User.findById(req.params.id);
        if(!existingUser) return res.status(404).json({message:"User not found"});

        const allDiscussion=await Discussion.find({user:req.params.id});
        if(allDiscussion.length!=0){
            return res.status(200).json({message:`All Posts by User:${existingUser.username}`,allDiscussion});
        }

        return res.status(200).json({message:"No posts till yet"});
        
    } catch (error) {
        re.status(500).json({message:'Internal server error'})
    } 
})

//update the post->(text,hashtags,image and also delete the previous img)
router.put("/updateDiscussion/:id",upload.single('image'),async(req,res)=>{
    try {
        const {text,hashtags}=req.body;

        const existingDiscussion=await Discussion.findById(req.params.id);
        if(!existingDiscussion){
            return res.status(404).json({error:'No such discussion exists'});
        }

        const update={}
        if(text){
            update.text=text;
        }

        if(hashtags){
            update.hashtags=hashtags.split(',').map(tag=>tag.trim());
        }

        if(req.file){
            console.log("updated img path: ",req.file.path);
            if(existingDiscussion.image){
                //deleting prev image
                fs.unlink(existingDiscussion.image,(err)=>{
                    if(err){
                        console.log('Error deleting the previous image',err);
                    }
                });
            }
            //set new image
            update.image=req.file.path;
        }

        const updatedDiscussion=await Discussion.findByIdAndUpdate(req.params.id,{
            $set:update,
        },{new:true});

        
        // await updatedDiscussion.save();
        res.status(200).json({message:'Updated discussion successfully',updatedDiscussion});
        
    } catch (error) {
        res.status(500).json({error:'Internal server error'});
    }
    
})

//delete discussion
router.delete('/deleteDiscussion/:id',async(req,res)=>{
    try {

        const existingDiscussion=await Discussion.findById(req.params.id);
        if(!existingDiscussion){
            return res.status(404).json({message:'No such Discussion exists'});
        }

        if(existingDiscussion.image){  //delete img from storage
            fs.unlink(existingDiscussion.image,(err)=>{
                if(err){
                    console.log('Error deleting the previous image',err);
                }
            });
        }

        await Discussion.findByIdAndDelete(req.params.id);
        res.status(200).json({message:'Deleted Discussion Successfully'});
        
    } catch (error) {
        res.status(500).json({error:'Internal server error'});
    }
})

//search discussion based on hashtags
router.get("/searchByHashtags",async(req,res)=>{
    const hashtags=req.query.hashtags;
    if(!hashtags){
        return res.status(400).json({message:'Hashtag required'});
    }

    const discussion=await Discussion.find({hashtags});
    if(discussion.length==0){
        return res.status(404).json({message:`No discussion with hashtag ${hashtags} exists :(`});
    }

    return res.status(200).json({message:`Discussions with hashtag: ${hashtags}`,discussion});
})

//search discussion based on text
router.get("/searchByText",async(req,res)=>{
    const text=req.query.text;
    if(!text){
        return res.status(400).json({message:'text required'});
    }

    const discussion=await Discussion.find({text});
    if(discussion.length==0){
        return res.status(404).json({message:`No discussion with text ${text} exists :(`});
    }

    return res.status(200).json({message:`Discussions with text: ${text}`,discussion});
})

//add comment
router.post("/addcomment/:id",async(req,res)=>{
    try {
        const {userId,comment}=req.body;

        const existingDiscussion=await Discussion.findById(req.params.id);
        if(!existingDiscussion){
            return res.status(404).json({message:"No such discussion exists"})
        }

        console.log("post is-> ",existingDiscussion);

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:'No such user exists'})
        }

        // console.log("commenting user is-> ",user);

        existingDiscussion.comments.push({ user: userId, text:comment });
        await existingDiscussion.save()

        res.status(200).json({message:'Comment Successfully added',comment});
        
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'});

    }
})

//like post
router.post("/like/:id",async(req,res)=>{
    try {
        const {userId}=req.body;

        const existingDiscussion=await Discussion.findById(req.params.id);
        if(!existingDiscussion){
            return res.status(404).json({message:'No such discussion exists'})
        }

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:'No such user exists'})
        }

        //if user have already liked
        if(existingDiscussion.likes.includes(userId)){
            return res.status(200).json({message:`User: ${user.username} has already liked the discussion`});
        }

        existingDiscussion.likes.push(userId);
        existingDiscussion.save();
        res.status(200).json({message:'Liked Discussion Successfully'})

        
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'});
    }
})

//like a comment
router.post("/likecomment/:discussionId/:commentId",async(req,res)=>{
    try {
        const {discussionId,commentId}=req.params;
        const {userId}=req.body;

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:'No such user exists'})
        }

        // console.log("user to like-> ",user);

        const existingDiscussion=await Discussion.findById(discussionId);
        if(!existingDiscussion){
            return res.status(404).json({message:'No such discussion exists'})
        }

        const comment= await existingDiscussion.comments.id(commentId);   //finding that particular comment out of multiple comments
        // console.log("comment to like",comment);


        if(!comment){
            return res.status(404).json({message:'no such comment exists'})
        }

        if(comment.likes.includes(userId)){  //if user has already liked the comment
            return res.status(200).json({message:`User: ${user.username} has already liked the discussion`});
        }


        comment.likes = [...comment.likes, userId];
        existingDiscussion.save();

        res.status(200).json({message:'Liked Comment Successfully',comment});

        
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'});

    }
})

//reply the comment
router.post("/replycomment/:discussionId/:commentId",async(req,res)=>{
    try {
        const {discussionId,commentId}=req.params;
        const {userId,replycomment}=req.body;

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:'No such user exists'})
        }

        // console.log("user to comment-> ",user);

        const existingDiscussion=await Discussion.findById(discussionId);
        if(!existingDiscussion){
            return res.status(404).json({message:'No such discussion exists'})
        }

        const comment= await existingDiscussion.comments.id(commentId);   //finding that particular comment out of multiple comments
        // console.log("comment to reply",comment);

        if(!comment){
            return res.status(404).json({message:'no such comment exists'})
        }

        comment.replies.push({user:userId,text:replycomment});
        await existingDiscussion.save();

        res.status(200).json({message:'Replied Successfully',replycomment});

        
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'});

    }
})


module.exports=router
