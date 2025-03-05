import express from "express";
import {
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  checkBudgetStatus,
} from "../controllers/budget.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.get("/", verifyJWT, getBudgets);
router.get("/:id", verifyJWT, getBudgetById);
router.put("/:id", verifyJWT, updateBudget);
router.delete("/:id", verifyJWT, deleteBudget);
router.get("/status", verifyJWT, checkBudgetStatus);

export default router;
