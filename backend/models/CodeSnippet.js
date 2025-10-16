const mongoose = require("mongoose");

const codeSnippetSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Untitled" },
    language: { type: String, default: "javascript" },
    code: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodeSnippet", codeSnippetSchema);


