import { Budget } from "../models/budget.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/mail.js";

const createBudget = asyncHandler(async (req, res) => {
  const { category, limit, startDate, endDate, alertThreshold } = req.body;
  const userId = req.user.id; // Extract user ID from authentication middleware

  // Validate required fields
  if (!category || !limit || !startDate || !endDate) {
    throw new ApiError(
      400,
      "All fields (category, limit, startDate, endDate) are required."
    );
  }

  // Convert startDate and endDate to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Ensure endDate is greater than startDate
  if (end <= start) {
    throw new ApiError(400, "End date must be later than the start date.");
  }

  // Convert category to lowercase for consistency
  const budget = new Budget({
    user: userId,
    category: category.toLowerCase(),
    limit,
    startDate: start,
    endDate: end,
    alertThreshold: alertThreshold ?? 80, // Default to 80% if not provided
  });

  const savedBudget = await budget.save();
  if (!savedBudget) {
    throw new ApiError(500, "Something went wrong while saving the budget");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, { budget }, "Budget created successfully."));
});

const getBudgets = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Extract user ID from authentication middleware

  // Extract page & limit from query params (default: page 1, limit 10)
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Fetch budgets with pagination
  const budgets = await Budget.find({ user: userId })
    .sort({ startDate: -1 }) // Sort by latest first
    .skip(skip)
    .limit(limit);

  // Get total count for pagination metadata
  const totalBudgets = await Budget.countDocuments({ user: userId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        budgets,
        currentPage: page,
        totalPages: Math.ceil(totalBudgets / limit),
        totalBudgets,
      },
      "Budgets fetched successfully."
    )
  );
});

// const checkBudgetStatus = asyncHandler(async (req, res) => {
//   const userId = req.user.id;

//   // Fetch all budgets for the user
//   const budgets = await Budget.find({ user: userId });

//   if (!budgets.length) {
//     return res
//       .status(200)
//       .json(new ApiResponse(200, { budgets: [] }, "No budgets found."));
//   }

//   let budgetStatus = [];

//   for (const budget of budgets) {
//     // Calculate total spending for this budget's category & time period
//     const totalSpent = await Transaction.aggregate([
//       {
//         $match: {
//           user: userId,
//           category: budget.category.toLowerCase(),
//           date: { $gte: budget.startDate, $lte: budget.endDate },
//         },
//       },
//       {
//         $group: { _id: null, total: { $sum: "$amount" } },
//       },
//     ]);

//     const spentAmount = totalSpent.length ? totalSpent[0].total : 0;
//     const percentageUsed = (spentAmount / budget.limit) * 100;
//     let status = "within limit";

//     if (percentageUsed >= budget.alertThreshold) status = "near limit";
//     if (spentAmount > budget.limit) status = "exceeded";

//     budgetStatus.push({
//       category: budget.category,
//       limit: budget.limit,
//       spent: spentAmount,
//       percentageUsed: percentageUsed.toFixed(2),
//       status,
//     });
//   }

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         { budgetStatus },
//         "Budget status fetched successfully."
//       )
//     );
// });

const getBudgetById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const budget = await Budget.findOne({ _id: id, user: userId });

  if (!budget) {
    throw new ApiError(404, "Budget not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { budget }, "Budget details fetched successfully.")
    );
});

const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, limit, startDate, endDate, alertThreshold } = req.body;
  const userId = req.user.id;

  const budget = await Budget.findOne({ _id: id, user: userId });

  if (!budget) {
    throw new ApiError(404, "Budget not found.");
  }

  // Validate and update fields if provided
  if (category) budget.category = category.toLowerCase();
  if (limit) budget.limit = limit;
  if (startDate) budget.startDate = new Date(startDate);
  if (endDate) budget.endDate = new Date(endDate);
  if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;

  // Ensure endDate > startDate
  if (budget.endDate <= budget.startDate) {
    throw new ApiError(400, "End date must be later than start date.");
  }

  savedBudget = await budget.save();

  if (!savedBudget) {
    throw new ApiError(500, "Something went wrong while saving the budget");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { budget }, "Budget updated successfully."));
});

const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const budget = await Budget.findOneAndDelete({ _id: id, user: userId });

  if (!budget) {
    throw new ApiError(404, "Budget not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Budget deleted successfully."));
});

 const checkBudgetStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  const userName = req.user.name;

  // Fetch budgets for the user
  const budgets = await Budget.find({ user: userId });

  if (!budgets.length) {
    return res.status(200).json(new ApiResponse(200, { budgets: [], alerts: [] }, "No budgets found."));
  }

  let budgetStatus = [];
  let alerts = [];

  for (const budget of budgets) {
    // Calculate total spending for this budget's category & time period
    const totalSpent = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          category: budget.category.toLowerCase(),
          date: { $gte: budget.startDate, $lte: budget.endDate },
        },
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } },
      },
    ]);

    const spentAmount = totalSpent.length ? totalSpent[0].total : 0;
    const percentageUsed = ((spentAmount / budget.limit) * 100).toFixed(2);
    let status = "within limit";

    if (percentageUsed >= budget.alertThreshold) status = "near limit";
    if (spentAmount > budget.limit) status = "exceeded";

    let alertMessage = null;

    // If spending is near/exceeds budget, send an email alert & add to response
    if (status !== "within limit") {
      alertMessage = `Your budget for ${budget.category} is ${status}. You have spent $${spentAmount} out of your limit of $${budget.limit}.`;

      // Send email notification
      await sendEmail({
        email: userEmail,
        subject: `⚠ Budget Alert: ${budget.category}`,
        mailgenContent: emailBudgetAlertContent(userName, budget.category, spentAmount, budget.limit, status),
      });

      // Store alert message for response
      alerts.push({ category: budget.category, message: alertMessage });
    }

    budgetStatus.push({
      category: budget.category,
      limit: budget.limit,
      spent: spentAmount,
      percentageUsed,
      status,
    });
  }

  return res.status(200).json(new ApiResponse(200, { budgetStatus, alerts }, "Budget status fetched successfully."));
});

export {
  createBudget,
  deleteBudget,
  updateBudget,
  getBudgetById,
  getBudgets,
  checkBudgetStatus,
};
