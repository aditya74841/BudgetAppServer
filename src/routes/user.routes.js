import { Router } from "express";
import passport from "passport";

import { UserRolesEnum } from "../constants.js";
import {
  verifyJWT,
  verifyPermission,
} from "../middlewares/auth.middlewares.js";
// import the passport config
import "../passport/index.js"
import {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userAssignRoleValidator,
  userForgotPasswordValidator,
  userResetForgottenPasswordValidator,
  userRegisterStaffValidator,
} from "../validators/auth/user.validators.js";
import { validate } from "../validators/validate.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { mongoIdPathVariableValidator } from "../validators/common/mongodb.validators.js";
import {
  assignRole,
  changeCurrentPassword,
  changePassword,
  forgotPasswordRequest,
  getCurrentUser,
  handleSocialLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  updateUserAvatar,
  verifyEmail,
} from "../controllers/user.controller.js";

const router = Router();

// Unsecured route
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:verificationToken").get(verifyEmail);

//TODO: NEED TO WORK ON THIS FORGET PASSWORD NOT WORK
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
  .route("/reset-password/:resetToken")
  .post(
    userResetForgottenPasswordValidator(),
    validate,
    resetForgottenPassword
  );

// Secured routes
router.route("/logout").get(verifyJWT, logoutUser);
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword
  );

// TODO Below Routes NOT WORKING
router
  .route("/change-password-directly/:userId")
  .post(verifyJWT, changePassword);
router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);

router
  .route("/assign-role/:userId")
  .post(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    mongoIdPathVariableValidator("userId"),
    userAssignRoleValidator(),
    validate,
    assignRole
  );

// SSO routes
router.route("/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  (req, res) => {
    console.log("Checking the google")
    res.send("redirecting to google...");
  }
);

router.route("/github").get(
  passport.authenticate("github", {
    scope: ["profile", "email"],
  }),
  (req, res) => {
    res.send("redirecting to github...");
  }
);

router
  .route("/google/callback")
  .get(passport.authenticate("google",{
    failureRedirect: '/login', // Redirect to login page on failure
    session: false // Disable session creation during OAuth flow
  }), handleSocialLogin);

router
  .route("/github/callback")
  .get(passport.authenticate("github"), handleSocialLogin);

export default router;
