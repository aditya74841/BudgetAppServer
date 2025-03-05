import { body } from "express-validator";
import { AvailableUserRoles } from "../../constants.js";

const userRegisterValidator = () => {
  return [
    body("name").trim().notEmpty().withMessage("Name is required"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    body("phoneNumber")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .isMobilePhone()
      .withMessage("Phone number is invalid"),
    body("role")
      .optional()
      .isIn(AvailableUserRoles)
      .withMessage("Role is invalid"),
  ];
};

const userRegisterStaffValidator = () => {
  return [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    body("storeId").trim().notEmpty().withMessage("Store Id is required"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Email is required"),
    body("username").optional(),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword").notEmpty().withMessage("New password is required"),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

const userResetForgottenPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is required")];
};

const userAssignRoleValidator = () => {
  return [
    body("role")
      .optional()
      .isIn(AvailableUserRoles)
      .withMessage("Invalid user role"),
  ];
};
export {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userAssignRoleValidator,
  userResetForgottenPasswordValidator,
  userForgotPasswordValidator,
  userRegisterStaffValidator,
};
