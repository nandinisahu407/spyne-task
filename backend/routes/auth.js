const router=require("express").Router();
const User=require('../models/user');
const bcrypt=require("bcryptjs");
const {check, validationResult}=require('express-validator');

//signin
router.post("/signup",
    [
        check('username','Username is required').not().isEmpty(),
        check('mobno','Mobile No must be 10 digits').isLength({min:10,max:10}),
        check('email','Email is invalid').isEmail(),
        check('password','Password must be atleast 6 characters long').isLength({min:6}),
    ],
    async(req,res)=>{

    //input validation check    
    const errors=validationResult(req);
    if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
    }

    try {
        const {username,mobno,email,password}=req.body;

        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:`User already exists`});
        }

        const hashpassword=bcrypt.hashSync(password);

        const user=new User({username,mobno,email,password:hashpassword});
        await user.save().then(()=>{
            res.status(200).json({message:`New user added successfully: ${user}`});
        })

        
    } catch (error) {
        res.status(500).json({error:`internal server error`});
        
    }
})

//login
router.post("/login",async(req,res)=>{
    try {
        const user=await User.findOne({email: req.body.email});
        if(!user){
            return res.status(400).json({message:"Email doesnot exists ,kindly Sign Up"});
        }
        
        const isPassword=bcrypt.compareSync(req.body.password, user.password);
        if(!isPassword){
            return res.status(400).json({message:"Password Incorrect"});
        }

        return res.status(200).json(user);
        
    } catch (error) {
        res.status(500).json({message:`${error}`});
        
    }
})

//update by email
router.put("/update/:id",
    [
        check('mobno','Mobile number must be 10 digits').optional().isLength({min:10,max:10}),
        check('email','Email is Invalid').optional().isEmail(),
        check('password','Password must be atleast 6 characters long').optional().isLength({min:6})
    ],
    async(req,res)=>{
        //validate inputs
        const errors=validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        try {
            const {id}=req.params;
            const{email,password}=req.body;

            const existingUser=await User.findById(id);
            if(!existingUser){
                return res.status(400).json({message:'User Not Found'});
            }

            if(email && email!=existingUser.email){  //ensuring email diff from current email
                const findUser=await User.findOne({email});
                if(findUser){       //searchin entire db
                    return res.status(400).json({message:'Email Already in Use'});
                }

                existingUser.email=email;
               
            }

            const isPassword=bcrypt.compareSync(req.body.password, existingUser.password);

            if(!isPassword) existingUser.password=bcrypt.hashSync(password);

            else{
                return res.status(400).json({message:'Nothing to update,Details are already same'});
            }
            
            await existingUser.save();
            res.status(200).json({message:'User updated successfully',existingUser});
            
        } catch (error) {
            res.status(500).json({message:'Internal server error'});
        }
    }
)

//delete user
router.delete("/deleteUser/:id",async(req,res)=>{
    try {
        const {id}=req.params;
        const existingUser=await User.findById(id);
        if(!existingUser){
            return res.status(400).json({message:'User Not found'});
        }
    
        await User.findByIdAndDelete(id).then(()=>{
            return res.status(200).json({message:'User Deleted Successfully'});
        })
        
    } catch (error) {
        res.status(500).json({message:'Internal server error'});

    }
   

})

//get all users
router.get("/allUsers",async(req,res)=>{
    try {
        const list=await User.find();
        if(list.length==0){
            return res.status(200).json({message:'No Users Found'});
        }
        res.status(200).json({message:'List of All Users',list});
        
    } catch (error) {
        res.status(500).json({message:'Internal server error'});
        
    }
    
})

//search user by username
router.get("/searchUser/:username", async(req,res)=>{
    try {
        const {username}=req.params;
        const existingUser=await User.find({username});
        if((existingUser.length==0)){
            return res.status(400).json({message:'No such user found'});
        }

        return res.status(200).json({message:'User Found',existingUser});

        
    } catch (error) {
        res.status(500).json({message:'Internal server error'});
        
    }
})

//follow
router.post("/follow",async(req,res)=>{
    try {

        const {userId,followId}=req.body;

        if(!userId || !followId){
            return res.status(400).json({message:"User Id and Follow Id are required"});
        }

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message:'User Not Found'});
        }

        const userToFollow=await User.findById(followId);
        if(!userToFollow){
            return res.status(404).json({message:'User to follow not found'});
        }

        if(user.following.includes(followId)){    //if already following
            return res.status(400).json({message:'Already following this user'});
        }

        //add user to following
        user.following.push(followId);
        await user.save();

        userToFollow.followers.push(userId);
        await userToFollow.save();

        res.status(200).json({message:'User Followed Successfully'});
        
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'});
        
    }
})



module.exports=router;