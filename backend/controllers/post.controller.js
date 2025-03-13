import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

export const addNewPost = async(req,res) => {
    try {
         const{caption} = req.body;
         const{image} = req.file;
         const authorId = req.id;

         if(!image)
         {
            return res.status(400).json({
                message : `Image Required`,
                success : false,
            })
         }
         const optimizedImageBuffer = await sharp(image.buffer).resize({width:800,height:800,fit:'inside'}).toFormat('jpeg' , {quality:80}).toBuffer();
         const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;

         const post = await Post.create({
            caption,
            image:cloudResponse.secure_url,
            author:authorId,
         });

        const user = await User.findById(authorId);
        if(user)
        {
            user.posts.push(post._id);
            await user.save();
        }
        await post.populate({path:'author',select:('-password')});
        return res.status(201).json({
            message : 'New Post Added',
            success:true,
            post,
        })

         const cloudResponse = await cloudinary.uploader.upload(fileUri);
    } catch (error) {
        console.log(error);
    }
}

export const getAllPost = async(req,res) => {
    try {
        const posts = await Post.find().sort({createdAt:-1}).populate({path:'author',select:'username , profilePicture'})
        .populate({
            path:'comments',
            sort:{createdAt:-1},
            populate:{
                path:'author',
                select:'username , profilePicture'
            }
        });

        return res.status(200).json({
            posts,
            success:true,
        })
    } catch (error) {
        console.log(error);
    }
}

export const getUserPost = async(req,res) =>{
    try {
        const authorId = req.id;
        const posts = await Post.find({author:authorId}).sort({createdAt:-1}).populate({
            path:'author',
            select:'username,profilePicture',
        }).populate({
            path:'comments',
            sort:{createdAt},
            populate:{
                path:'author',
                select:'username,profilePicture',
            }
        });
        return res.status(200).json({
            posts,
            success:true,
        })
    } catch (error) {
        console.log(error);
    }
}

export const likePost = async(req,res) => {
    try {
        const likekrneWalaUserKiId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);

        if(!post) 
        {
            return res.status(404).json({
                message : "Post not Found",
                success : false,
            })
        }

        //like logic started
        await post.updateOne({$addToSet:{likes:likekrneWalaUserKiId}});
        await post.save();

        //implementing socket.io for real time notification




        return res.status(200).json({
            message : "Post Liked",
            success : true,
        })

    } catch (error) {
        console.log(error);
    }
}


export const disLikePost = async(req,res) => {
    try {
        const likekrneWalaUserKiId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);

        if(!post) 
        {
            return res.status(404).json({
                message : "Post not Found",
                success : false,
            })
        }

        //like logic started
        await post.updateOne({$pull:{likes:likekrneWalaUserKiId}});
        await post.save();

        //implementing socket.io for real time notification




        return res.status(200).json({
            message : "Post DisLiked",
            success : true,
        })

    } catch (error) {
        console.log(error);
    }
}

export const addComment = async(req,res) => {
    try {
        const postId = req.params.id;
        const commentKrneWaleUserKiId = req.id;

        const {text} = req.body;
        const {post} = await Post.findById(postId);
        if(!text) 
        {
            return res.status(400).json({
                message : "No Comment Available",
                success : false,
            })
        }

        const comment = await Comment.create({
            text,
            author:commentKrneWaleUserKiId,
            post:postId,
        }).populate({
            path:'author',
            select:"username,profilePicture",
        });

        post.comments.push(AiOutlineComment._id);
        await post.save();

        return res.status({
            message : "Comment Added",
            comment,
            success:true,
        })

    } catch (error) {
        console.log(error);
    }
};


export const getCommentsOfPost = async(req,res) => {
    try {
        const postId = req.params.id;
        const comments = await Comment.find({post:postId}).populate('author' , 'username' , 'profilePicture');


        if(!comments) return res.status(404).json({
            message : 'No Comments found',
            success : false,
        })

        return res.status(200).json({
            success : true,
        })

    } catch (error) {
        console.log(error);
    }
};


export const deletePost = async(req,res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);

        if(!post) return res.status(404).json({
            message : "No Post Found",
            success : false,
        })


        //check if the logged in user is the owner of post
        if(post.author.toString() !== authorId)
        {
            return res.status(403).json({
                message : "Not The owner of Post",
                success : false,
            })
        }

        await Post.findByIdAndDelete(postId);

        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString()!== postId);
        await user.save();

        await Comment.deleteMany({post:postId});

        return res.status(200).json({
            message : "Post Deleted",
            success : true,
        })

    } catch (error) {
        console.log(error);
    }
}

export const bookmarkPost = async(req,res) => {
    try
    {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({
            message : 'Post not Found',
            success : false,
        })

        const user = await User.findById(authorId);

        if(user.bookmarks.includes(post._id))
        {
            //already bookmarked ->remove from bookmarked
            await user.updateOne({$pull:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({
                type : 'unsaved',
                message : 'post removed from bookmark',
                success : true,
            })
        }
        else
        {
            await user.updateOne({$addToSet:{bookmarks:post_id}});
            await user.save();
            return res.status(200).json({
                type : 'saved',
                message : 'Post saved to bookmarks',
                success : true,
            })
            //we have to bookmark
        }

    }
    catch(error)
    {
        console.log(error);
    }
}