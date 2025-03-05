import express from "express";
import { 
  createTransaction, 
  getTransactions, 
  getTransactionById, 
  updateTransaction, 
  deleteTransaction 
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// ✅ Create a Transaction
router.post("/", verifyJWT, createTransaction);

// ✅ Get All Transactions (with filters & pagination)
router.get("/", verifyJWT, getTransactions);

// ✅ Get a Single Transaction by ID
router.get("/:id", verifyJWT, getTransactionById);

// ✅ Update a Transaction
router.put("/:id", verifyJWT, updateTransaction);

// ✅ Delete a Transaction
router.delete("/:id", verifyJWT, deleteTransaction);

export default router;
