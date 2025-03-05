import { Transaction } from "../models/transaction.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTransaction = asyncHandler(async (req, res) => {
  let {
    amount,
    type,
    category,
    description,
    date,
    isRecurring,
    recurrenceInterval,
  } = req.body;
  const userId = req.user.id;

  // Convert to lowercase before saving
  type = type.toLowerCase();
  category = category.toLowerCase();
  if (recurrenceInterval) recurrenceInterval = recurrenceInterval.toLowerCase();

  // Validate input
  if (!amount || !type || !category || !date) {
    throw new ApiError(400, "All required fields must be provided.");
  }

  if (!["income", "expense"].includes(type)) {
    throw new ApiError(
      400,
      "Invalid transaction type. Must be 'income' or 'expense'."
    );
  }

  if (isRecurring && !recurrenceInterval) {
    throw new ApiError(
      400,
      "Recurring transactions must have a recurrenceInterval."
    );
  }

  const transaction = await Transaction.create({
    user: userId,
    amount,
    type,
    category,
    description,
    date,
    isRecurring: isRecurring || false,
    recurrenceInterval: isRecurring ? recurrenceInterval : null,
  });

  if (!transaction) {
    throw new ApiError(
      500,
      "Something went wrong while creating the transaction."
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, { transaction }, "Transaction created successfully.")
    );
});

const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    type,
    category,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    isRecurring,
    page = 1,
    limit = 10,
  } = req.query;

  let filter = { user: userId };

  if (type) filter.type = type.toLowerCase();
  if (category) filter.category = category.toLowerCase();
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (isRecurring !== undefined) filter.isRecurring = isRecurring === "true";

  // Pagination setup
  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);
  const skip = (pageNumber - 1) * pageSize;

  const transactions = await Transaction.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(pageSize);

  const totalTransactions = await Transaction.countDocuments(filter);
  const totalPages = Math.ceil(totalTransactions / pageSize);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          transactions,
          totalTransactions,
          totalPages,
          currentPage: pageNumber,
        },
        "Transactions fetched successfully."
      )
    );
});

const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transaction },
        "Transaction retrieved successfully."
      )
    );
});

const updateTransaction = asyncHandler(async (req, res) => {
  const {
    amount,
    type,
    category,
    description,
    date,
    isRecurring,
    recurrenceInterval,
  } = req.body;

  let transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.");
  }

  transaction.amount = amount || transaction.amount;
  transaction.type = type ? type.toLowerCase() : transaction.type;
  transaction.category = category
    ? category.toLowerCase()
    : transaction.category;
  transaction.description = description || transaction.description;
  transaction.date = date || transaction.date;
  transaction.isRecurring =
    isRecurring !== undefined ? isRecurring : transaction.isRecurring;
  transaction.recurrenceInterval = isRecurring
    ? recurrenceInterval || transaction.recurrenceInterval
    : null;

  await transaction.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { transaction }, "Transaction updated successfully.")
    );
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Transaction deleted successfully."));
});

export {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
