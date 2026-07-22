import Post from "../models/Post.js";

// create post
export const createPost = async (req, res) => {
  try {
    const { title, body, image } = req.body;

    const post = await Post.create({
      title,
      body,
      image: image?.trim() || undefined,
      author: req.userId,
    });
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

    const { title, body, image } = req.body;

    post.title = title ?? post.title;
    post.body = body ?? post.body;
    if (image !== undefined) post.image = image.trim() || undefined;

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
