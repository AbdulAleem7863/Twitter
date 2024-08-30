import bcrypt from "bcryptjs"
import { v2 as cloudinary } from "cloudinary"


import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"

export const getUserProfile = async (req, res) => {
    const { username } = req.params
    try {
        const user = await User.findOne({ username }).select("-password")
        if (!user) return res.status(404).json({ error: "User Not Found" })

        return res.status(200).json(user)
    } catch (error) {
        console.log(`Error in get user profile controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}


export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (!userToModify || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (id === req.user._id) {
            return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Unfollow user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            return res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

            //send notification
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,

            })
            await newNotification.save()
            //    retrun id of user 
            return res.status(200).json({ message: "User followed successfully" });
        }

    } catch (error) {
        console.error(`Error in follow/unfollow user controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};



export const getSuggestedUser = async (req, res) => {
    try {
        const userId = req.user._id
        const userFollowedByMe = await User.findById(userId).select("following")
        const users = await User.aggregate([
            { $match: { _id: { $ne: userId } } },
            { $sample: { size: 10 } }
        ])

        const filteredUser = users.filter(user => !userFollowedByMe.following.includes(user._id))
        const suggestedUser = filteredUser.slice(0, 4)

        suggestedUser.forEach(user => user.password = null);
        return res.status(200).json(suggestedUser);

    } catch (error) {
        console.error(`Error in get Suggested User  controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const updateUser = async (req, res) => {

    const { username, email, fullName, currentPassword, newPassword, bio, link } = req.body
    let { profileImg, coverImg } = req.body
    const userId = req.user._id

    try {
        let user = await User.findById(userId)
        if (!user) return res.status(404).json({ error: "User not Found" });

        if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ error: "Provide Both Current and New Password" });
        }
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password)
            if (!isMatch) return res.status(400).json({ error: "Current Password is incorrect" });
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New Password must be atleast 6 characters" });
            }
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
        }

        if (profileImg) {
            if (user.profileImg) {
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg)
            profileImg = uploadedResponse.secure_url;
        }
        if (coverImg) {
            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg)
            coverImg = uploadedResponse.secure_url;
        }
        user.fullName = fullName || user.fullName
        user.email = email || user.email
        user.username = username || user.username
        user.bio = bio || user.bio
        user.link = link || user.link
        user.profileImg = profileImg || user.profileImg
        user.coverImg = coverImg || user.coverImg

        user = await user.save()

        user.password = null
        return res.status(200).json(user)
    } catch (error) {
        console.error(`Error in Update User controller: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}