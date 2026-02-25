const express = require("express");
const listController = require("../controllers/listController");
const { authenticateToken, optionalAuthenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuthenticateToken, listController.getLists);
router.get("/:listId", optionalAuthenticateToken, listController.getListDetail);
router.post("/", optionalAuthenticateToken, listController.createList);
router.put("/:listId", optionalAuthenticateToken, listController.updateList);
router.delete("/:listId", optionalAuthenticateToken, listController.deleteList);
router.post("/:listId/items", optionalAuthenticateToken, listController.addFestivalToList);
router.delete("/:listId/items/:festivalId", optionalAuthenticateToken, listController.removeFestivalFromList);
router.post("/:listId/collaborators", optionalAuthenticateToken, listController.addCollaborator);

module.exports = router;
