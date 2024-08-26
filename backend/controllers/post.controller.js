import { v2 as cloudinary } from "cloudinary"
import User from "../models/user.model.js"
import Post from "../models/post.model.js"

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