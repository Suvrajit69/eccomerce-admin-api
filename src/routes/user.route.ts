import { Router } from "express";
import { signInJwt, signOutJwt, signUpJwt } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/signup").post(signUpJwt);
router.route("/signin").post(signInJwt);

//secure routes
router.route("/signout").post(verifyJWT,signOutJwt);

export default router;