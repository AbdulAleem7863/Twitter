import { generateTokenandSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"

export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log(req.body);

            console.log(`Email received: ${email}`);
            return res.status(400).json({ error: "Invalid email format" })
        }
        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" })
        }

        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" })
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be atleats 6 characters" })
        }

        // hashPassword
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        })

        if (newUser) {
            generateTokenandSetCookie(newUser._id, res)
            await newUser.save();
            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg
            })
        } else {
            return res.status(400).json({ error: "Invalid User Data" })
        }
    } catch (error) {
        console.log(`Error in sign up controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }

}


export const login = async (req, res) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        const isPasswordValid = await bcrypt.compare(password, user?.password || "")

        if (!user || !isPasswordValid) {
            return res.status(400).json({ error: "Incorrect Username or Password" })
        }
        generateTokenandSetCookie(user._id, res)
        return res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg
        })
    } catch (error) {
        console.log(`Error in login controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }

}


export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        return res.status(200).json({ message: "Logged out Successfully" })
    } catch (error) {
        console.log(`Error in logout controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }

}


export const getMe = async (req,res) => {
    try {
        const user = await User.findById(req.user._id).select("-password")
        return res.status(200).json(user)
        
    } catch (error) {
        console.log(`Error in getme controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}