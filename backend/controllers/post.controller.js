import { v2 as cloudinary } from "cloudinary"
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js"
import Post from "../models/post.model.js"

export const getAllPost = async (req, res) => {
    try {

        const allPosts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" })
        // .populate({ path: "likes", select: "-password" })

        if (allPosts.lenght == 0) {

            return res.status(200).json([]);
        }
        return res.status(200).json(allPosts);

    } catch (error) {
        console.log(`Error in get all post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const createPost = async (req, res) => {
    try {
        const { text } = req.body
        let { img } = req.body

        const userId = req.user._id.toString()

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ error: "User not Found" })

        if (!text && !img) {
            return res.status(400).json({ error: "Post must have text or image" })
        }

        if (img) {
            const uploadedResponse = cloudinary.uploader.upload(img)
            img = (await uploadedResponse).secure_url;
        }

        const newPost = new Post({
            user: userId,
            text,
            img
        })

        await newPost.save()

        return res.status(201).json(newPost)
    } catch (error) {
        console.log(`Error in create post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id
        const { id: postId } = req.params

        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ error: "Post not Found" });
        }

        const userLikedPost = post.likes.includes(userId)
        if (userLikedPost) {
            // unlike post 
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } })
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } })
            return res.status(200).json({ message: "You unliked the post" });

        } else {
            // liked post
            post.likes.push(userId)
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } })

            await post.save()

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            })
            await notification.save()
            return res.status(200).json({ message: "You liked the post" });
        }

    } catch (error) {
        console.log(`Error in like and unlike on post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body
        const postId = req.params.id
        const userId = req.user._id

        if (!text) {
            return res.status(400).json({ error: "Comment is required" });
        }
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ error: "Post not Found" });
        }

        const comment = { user: userId, text }

        post.comments.push(comment)
        await post.save()
        return res.status(200).json(post);

    } catch (error) {
        console.log(`Error in comment on post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ error: "Post not Found" });
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(400).json({ error: "You are not Authorized to delete this post" });
        }

        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId)
        }

        await Post.findByIdAndDelete(req.params.id)
        return res.status(200).json({ message: "Post Deleted Successfully" });

    } catch (error) {
        console.log(`Error in delete post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const getLikedPosts = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ error: "User not Found" });

        const likedPost = await Post.find({ _id: { $in: user.likedPosts } })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" })

        return res.status(200).json(likedPost);
    } catch (error) {
        console.log(`Error in get liked post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const getFollowingUserPosts = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ error: "User not Found" });

        const following = user.following
        const feedPost = await Post.find({ user: { $in: following } })
            .sort({ createdAt: -1 })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" })

        return res.status(200).json(feedPost);
    } catch (error) {
        console.log(`Error in get following user post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params
        const user = await User.findOne({ username })
        if (!user) return res.status(404).json({ error: "User not Found" });

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" })

        return res.status(200).json(posts);
    } catch (error) {
        console.log(`Error in get  user post controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}