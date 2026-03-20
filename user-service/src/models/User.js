const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "alumni", "admin"],
      default: "student",
    },
    fullName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    headline: { type: String, trim: true },
    bio: { type: String, trim: true },
    location: { type: String, trim: true },
    profilePicUrl: { type: String },
    coverPicUrl: { type: String },
    batchYear: { type: Number },
    graduationYear: { type: Number },
    skills: [{ type: String }],
    links: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Indexes for searching
userSchema.index({
  fullName: "text",
  headline: "text",
  bio: "text",
  skills: "text",
});

module.exports = mongoose.model("User", userSchema);
