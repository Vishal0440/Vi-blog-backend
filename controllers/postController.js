import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
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
export const upload = multer({ storage });

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
  const posts = await Post.find()
    .populate("author", "name email")
    .sort({ createdAt: -1 });
  res.json(posts);
};

// get single post
export const getPost = async (req, res) => {
  const post = await Post.findById(req.params.id).populate("author", "name");
  if (!post) return res.status(404).json({ message: "Not found" });
  res.json(post);
};

// update post
export const updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Not found" });
  if (post.author.toString() !== req.userId)
    return res.status(403).json({ message: "Forbidden" });
  const { title, body } = req.body;
  if (req.file) post.image = `/uploads/${req.file.filename}`;
  post.title = title ?? post.title;
  post.body = body ?? post.body;
  await post.save();
  res.json(post);
};

// delete post
export const deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post Not found" });
  if (post.author.toString() !== req.userId)
    return res.status(403).json({ message: "Forbidden" });
  await post.deleteOne();
  res.json({ message: "Deleted" });
};

// toggle like
export const toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({});
  const idx = post.likes.findIndex((id) => id.toString() === req.userId);
  if (idx === -1) post.likes.push(req.userId);
  else post.likes.splice(idx, 1);
  await post.save();
  res.json({ likesCount: post.likes.length, liked: idx === -1 });
};

// comments
export const addComment = async (req, res) => {
  const { text } = req.body;
  const { postId } = req.params;
  const comment = await Comment.create({
    post: postId,
    author: req.userId,
    text,
  });
  res.json(comment);
};

export const getComments = async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId }).populate(
    "author",
    "name"
  );
  res.json(comments);
};
