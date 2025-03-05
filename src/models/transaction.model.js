import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true, // Ensures it's stored in lowercase
      trim: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceInterval: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: function () {
        return this.isRecurring;
      },
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
