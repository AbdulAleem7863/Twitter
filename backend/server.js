import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import cors from "cors"
import cookieParser from 'cookie-parser'
import { v2 as cloudinary } from "cloudinary"


import authRoutes from './routes/auth.route.js'
import userRoutes from './routes/user.route.js'
import postRoutes from './routes/post.route.js'
import notificationRoutes from './routes/notification.route.js'
import connectMongoDB from './db/connectMongoDB.js'

dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const app = express()
const port = process.env.PORT || 5000
const __dirname = path.resolve()



app.use(express.json({ limit: "5mb" }))
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/notifications', notificationRoutes)


app.get('/', (req, res) => {
    res.send("Hello world")
})



app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
    connectMongoDB()

})