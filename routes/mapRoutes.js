const express = require("express");
const mapController = require("../controllers/mapController");

const router = express.Router();

router.get("/filters", mapController.getFilters);
router.get("/markers", mapController.getMarkers);

module.exports = router;
