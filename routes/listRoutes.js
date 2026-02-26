const express = require("express");
const listController = require("../controllers/listController");
const { authenticateToken, optionalAuthenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, listController.getLists);
router.get("/:listId", optionalAuthenticateToken, listController.getListDetail);
router.post("/", authenticateToken, listController.createList);
router.put("/:listId", authenticateToken, listController.updateList);
router.delete("/:listId", authenticateToken, listController.deleteList);
router.post("/:listId/items", authenticateToken, listController.addFestivalToList);
router.delete("/:listId/items/:festivalId", authenticateToken, listController.removeFestivalFromList);
router.post("/:listId/collaborators", authenticateToken, listController.addCollaborator);
router.post("/:listId/collaborators/accept", authenticateToken, listController.acceptInvitation);
router.post("/:listId/collaborators/reject", authenticateToken, listController.rejectInvitation);
router.delete("/:listId/collaborators/:collaboratorId", authenticateToken, listController.removeCollaborator);

module.exports = router;
