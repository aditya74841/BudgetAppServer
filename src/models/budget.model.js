import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    alertThreshold: {
      type: Number,
      default: 80, // Default alert when 80% of the budget is used
    },
  },
  { timestamps: true }
);

export const Budget = mongoose.model("Budget", budgetSchema);
