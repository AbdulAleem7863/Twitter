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


export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id

        await Notification.deleteMany({ to: userId })
        return res.status(200).json({ message: "Notifications Deleted Successfully" })
    } catch (error) {
        console.log(`Error in delete notifictaions controller ${error.message}`)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}


// export const deleteNotification = async (req, res) => {
//     try {
//         const notificationId = req.param.id
//         const userId = req.user._id
//         const notification = await Notification.findById(notificationId)

//         if (!notification) return res.status(404).json({ error: "Notification not Found" })
             
//         if (notification.to.toString() !== userId.toString()) {
//             return res.status(403).json({ error: "You cannot delete this notifcation" })

//         }
//         await Notification.findByIdAndDelete(notificationId)
//         return res.status(200).json({ message: "Notification Deleted Successfully" })
//     } catch (error) {
//         console.log(`Error in delete notifictaion controller ${error.message}`)
//         return res.status(500).json({ error: "Internal Server Error" })
//     }
// }