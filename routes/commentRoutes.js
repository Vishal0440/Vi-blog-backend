import express from "express";
import auth from "../middleware/auth.js";
import { addComment, getComments } from "../controllers/postController.js"; // reuse functions

const router = express.Router();

router.get("/:postId", getComments);
router.post("/:postId", auth, addComment);

export default router;
