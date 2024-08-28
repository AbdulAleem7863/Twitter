import Notification from "../models/notification.model.js"

export const getNotification = async (req, res) => {
    try {
        const userId = req.user._id

        const notification = await Notification.find({ to: userId })
            .populate({ path: "from", select: "username profileImg" })

        await Notification.updateMany({ to: userId }, { read: true })

        return res.status(200).json(notification)

    } catch (error) {
        console.log(`Error in get all notifictaion controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}


export const deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id

        await Notification.deleteMany({ to: userId })
        return res.status(200).json({ message: "Notification Deleted Successfully" })
    } catch (error) {
        console.log(`Error in delete notifictaion controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}