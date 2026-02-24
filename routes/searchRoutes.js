const express = require("express");
const searchController = require("../controllers/searchController");

const router = express.Router();

router.get("/", searchController.search);
router.get("/history", searchController.getSearchHistory);
router.post("/history", searchController.saveSearchHistory);
router.get("/popular", searchController.getPopularFestivals);

module.exports = router;
