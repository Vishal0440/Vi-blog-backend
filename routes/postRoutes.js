import express from "express";
import auth from "../middleware/auth.js";
import * as ctrl from "../controllers/postController.js";

const router = express.Router();

router.get("/", ctrl.getAllPosts);
router.get("/:id", ctrl.getPost);
router.post("/", auth, ctrl.upload.single("image"), ctrl.createPost);
router.put("/:id", auth, ctrl.upload.single("image"), ctrl.updatePost);
router.delete("/:id", auth, ctrl.deletePost);
router.post("/:id/like", auth, ctrl.toggleLike);

// comment endpoints exist in commentRoutes
export default router;
