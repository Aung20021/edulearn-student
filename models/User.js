import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Only required for email/password sign-in
  role: { type: String, enum: ["teacher", "student"], default: "student" }, // Default to "teacher"
  provider: { type: String, enum: ["google", "email"], required: true }, // Track auth method
  image: { type: String }, // Store profile picture URL
  lastVisitedCourse: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // Store last visited course
  lastVisitedLesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }, // Store last visited lesson
  createdAt: { type: Date, default: Date.now },
  // ✅ Subscription-related fields
  subscription: {
    isActive: { type: Boolean, default: false },
    interval: { type: String, enum: ["1m", "3m", "6m", "12m"] },
    startDate: { type: Date },
    endDate: { type: Date },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    isCancelled: { type: Boolean, default: false }, // <-- NEW FIELD
  },
  viewedCourses: [
    {
      course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      viewedAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
