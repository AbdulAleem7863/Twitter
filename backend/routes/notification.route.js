import express from "express"
import { protectRoute } from "../middleware/protectRoute.js"
import { getNotification, deleteNotification } from '../controllers/notification.controller.js';


const router = express.Router()

router.get("/", protectRoute, getNotification)
router.delete("/", protectRoute, deleteNotification)


export default router