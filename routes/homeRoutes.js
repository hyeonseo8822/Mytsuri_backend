const express = require("express");
const homeController = require("../controllers/homeController");

const router = express.Router();

router.get("/banners", homeController.getBanners);
router.get("/categories", homeController.getCategories);
router.get("/cities", homeController.getCities);
router.get("/festivals", homeController.getFestivals);

module.exports = router;
