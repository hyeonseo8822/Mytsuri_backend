const express = require("express");
const { getRecommendations } = require("../controllers/recommendationController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/recommendations - AI 기반 추천 축제 (5개)
router.get("/", authenticateToken, getRecommendations);

module.exports = router;
