const express = require("express");
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, notificationController.getNotifications);
router.get("/unread-count", authenticateToken, notificationController.getUnreadCount);
router.get("/debug/info", authenticateToken, notificationController.getDebugInfo);
router.patch("/:notificationId/read", authenticateToken, notificationController.markAsRead);
router.patch("/read-all", authenticateToken, notificationController.markAllAsRead);
router.delete("/:notificationId", authenticateToken, notificationController.deleteNotification);
router.post("/:notificationId/accept", authenticateToken, notificationController.acceptListInvite);
router.post("/:notificationId/reject", authenticateToken, notificationController.rejectListInvite);

module.exports = router;
