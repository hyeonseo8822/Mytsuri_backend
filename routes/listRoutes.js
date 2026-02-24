const express = require("express");
const listController = require("../controllers/listController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, listController.getLists);
router.post("/", authenticateToken, listController.createList);
router.put("/:listId", authenticateToken, listController.updateList);
router.post("/:listId/items", authenticateToken, listController.addFestivalToList);
router.delete("/:listId/items/:festivalId", authenticateToken, listController.removeFestivalFromList);
router.post("/:listId/collaborators", authenticateToken, listController.addCollaborator);

module.exports = router;
