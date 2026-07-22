import Post from "../models/Post.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches frontend limit
});

// Removes a previously uploaded image from disk. Safe to call with
// undefined/missing files — used when replacing or deleting a post's image.
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const filename = path.basename(imagePath);
  const fullPath = path.join(uploadDir, filename);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete image file:", fullPath, err.message);
    }
  });
};

// create post
export const createPost = async (req, res) => {
  try {
    const { title, body } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    const post = await Post.create({ title, body, image, author: req.userId });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get all posts (public)
export const getAllPosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.author) filter.author = req.query.author;

    const posts = await Post.find(filter)
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get single post
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) return res.status(404).json({ message: "Not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });
    if (post.author.toString() !== req.userId)
      return res.status(403).json({ message: "Forbidden" });

    const { title, body } = req.body;

    if (req.file) {
      deleteImageFile(post.image); // clean up the old file being replaced
      post.image = `/uploads/${req.file.filename}`;
    }

    post.title = title ?? post.title;
    post.body = body ?? post.body;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// delete post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post Not found" });
    if (post.author.toString() !== req.userId)
      return res.status(403).json({ message: "Forbidden" });

    deleteImageFile(post.image);
    await post.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// toggle like
export const toggleLike = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });

    const idx = post.likes.findIndex((id) => id.toString() === req.userId);
    if (idx === -1) post.likes.push(req.userId);
    else post.likes.splice(idx, 1);

    await post.save();
    res.json({ likesCount: post.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
