import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import getDataUri from "../utils/datauri.js";
//import {v2 as cloudinary} from "cloudinary";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";




//user register krne ke lia
export const register = async(req,res) => {
    try
    {
        const {username , email , password} = req.body; //destructure karke sath me saare cheeze le elia
        if(!username || !email || !password)
        {
            return res.status(401).json(
                {
                    message : "Something is missing in above fields",
                    success : false,
                }
            )
        }

        const user = await User.findOne({email});
        if(user)
        {
            return res.status(401).json(
                {
                    message :"User Already Exists",
                    success :false,
                }
            )
        }
        else
        {
            const hashedPassword = await bcrypt.hash(password,10); //bcrypt tumhara password ko save rakhta hai sabse protected hash value me
                                                    //passwords,salt value (matab kitna khatrnaak hash krna ha)
            await User.create(
                {
                    username,
                    email,
                    password : hashedPassword,
                }
            );
            return res.status(201).json(
                {
                    message : "Account created successfully",
                    success: true,
                }
            );
        }
    }
    catch(err)
    {
        console.log(err);
    }
}


//user login ke liye

export const login = async(req,res) => 
    {
        try
        {
            const {email , password} = req.body;
            if(!email || !password)
            {
                return res.status(401).json(
                    {
                        message : "Invalid or Empty Input Fields",
                        success : false, 
                    }
                )
            }
            else
            {
                let user = await User.findOne({email});   //let islia baad me user change na krna ho
                if(!user)
                {
                    return res.status(401).json(
                        {
                            message : "Incorrect Email or Password",
                            success : false, 
                        }
                    )
                }
                else
                {
                    const isPasswordMatch = await bcrypt.compare(password,user.password);
                    if(!isPasswordMatch)
                    {
                        return res.status(401).json(
                            {
                                message : "Incorrect Password",
                                success : false, 
                            }
                        )
                    }
                    else
                    {
                        user = {
                            _id : user._id,
                            username : user.username,
                            email : user.email,
                            profilePicture : user.profilePicture,
                            user : user.bio,
                            followers : user.followers,
                            following : user.following,
                            posts : user.posts,
                        } //this is just for frontend



                        const token = await jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn:'1d'}); //jab tak token hoga i.e cokkies me tab tak tumke login again ni krna padega jaise hi token expire hoga(after a time) tum again login krna hoga


                        const populatedPosts = await Promise.all(
                            user.posts.map( async (postId) => {
                                const post = await Post.findById(postId);
                                if(post.author.equals(user._id))
                                {
                                    return post;
                                }
                                return null;
                            })
                        )



                        return res.cookie('token',token,{httpOnly : true , sameSite:'strict',maxAge:1*24*60*60*1000}).json({
                            message : `Welcome back ${user.username}`,
                            success : true,
                            user
                        }); //for sql injection  and safe site scripting
                    }
                }
            }
        }
        catch(err)
        {
            console.log(err);
        }
    };


    // for logging out

export const logout = async(_,res) => {
    try
    {
        return res.cookie("token","",{maxAge:0}).json({ //we just removed cookie
            message : "LOGGED OUT SUCCESSFULLY",
            success : true,
        })
    }
    catch(err)
    {
        console.log(err);
    }
};

//view or get profike

export const getProfile = async(req,res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).select('-password');
        return res.status(200).json({
            user,
            success : true,
        })
    }
    catch(err)
    {
        console.log(err);
    }
}

export const editProfile = async(req,res) => {
    try {
        const userId = req.id;
        let cloudResponse;
        const {bio , gender} = req.body;
        const profilePicture = req.file;

        if(profilePicture)
        {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if(!user) 
        {
            return res.status(404).json({
                message : "User not found",
                success : false,
            })
        }
        if(bio)
        {
            user.bio = bio;
        }
        if(gender) 
        {
            user.gender = gender;
        }
        if(profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message : "Profile Updated",
            success : true,
            user,
        }) 
    } catch (error) {
        console.log(error);
    }
}


//get other user

export const getSuggestedUser = async(req,res) => {
    try {
        const suggestedUser = await User.find({_id:{$ne:req.id}}).select("-passsword"); //$ne: means not equal
        if(!suggestedUser)
        {
            return res.status(400).json({
                message : "Currently doesnot have any users",
                success : false,
            })
        }
        return res.status(200).json({
            success : true,
            users : suggestedUser,
        })
    } catch (error) {
        console.log(error);
    }
};

export const followOrUnfollow = async(req,res) => {
    try {
        const followKarneWala = req.id;
        const jiskoFollowKronga = req.params.id;

        if(followKarneWala === jiskoFollowKronga)
        {
            return res.status(400).json({
                message : "You cannot follow/Unfollow Yourself",
                success: false,
            });
        }

        const user = await User.findById(followKarneWala);
        const targetUser = await User.findById(jiskoFollowKronga);

        if(!user || !targetUser)
        {
            return res.status(400).json({
                message : "User Not Found",
                success: false,
            });
        }

        //now follow unfollow logic

        const isFollowing = user.following.includes(jiskoFollowKronga);
        if(isFollowing)
        {
            //unfolow logic
            await Promise.all([
                User.updateOne({_id:followKarneWala},{$pull:{following:jiskoFollowKronga}}),
                User.updateOne({_id:jiskoFollowKronga},{$pull:{followers:followKarneWala}}),

            ]);
            return res.status(200).json({
                message : "Unfollow Successfully",
                success : true,
            });
        }
        else
        {
            //follow logic
            await Promise.all([
                User.updateOne({_id:followKarneWala},{$push:{following:jiskoFollowKronga}}),
                User.updateOne({_id:jiskoFollowKronga},{$push:{followers:followKarneWala}}),

            ])
            return res.status(200).json({
                message : "Follow Successfully",
                success : true,
            });
        }

    } catch (error) {
        console.log(error);
    }
}
