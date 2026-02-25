const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/me", authenticateToken, userController.getMe);
router.put("/me", authenticateToken, upload.single('profileImage'), userController.updateProfile);
router.put("/me/preferences", authenticateToken, userController.updatePreferences);
router.get("/me/reviews", authenticateToken, userController.getMyReviews);
router.post("/me/survey", authenticateToken, userController.saveSurvey);

module.exports = router;
