const express = require("express");
const festivalController = require("../controllers/festivalController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/recommended", festivalController.getRecommended);
router.get("/trending", festivalController.getTrending);
router.get("/popular", festivalController.getPopular);
router.get("/map", festivalController.getMapFestivals);
router.get("/", festivalController.getFestivals);
router.get("/:festivalId", festivalController.getFestivalDetail);
router.get("/:festivalId/reviews", festivalController.getFestivalReviews);
router.post("/:festivalId/reviews", authenticateToken, festivalController.createFestivalReview);

module.exports = router;
