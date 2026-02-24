const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/me", authenticateToken, userController.getMe);
router.put("/me", authenticateToken, userController.updateProfile);
router.put("/me/preferences", authenticateToken, userController.updatePreferences);
router.get("/me/reviews", authenticateToken, userController.getMyReviews);

module.exports = router;
