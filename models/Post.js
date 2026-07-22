import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: String,
    image: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    image: {
      data: Buffer,
      contentType: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Post", postSchema);
