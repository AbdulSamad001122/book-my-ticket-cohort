import express from "express";
import authController from "./auth.controller.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import validate from "../../common/middleware/validate.middleware.js";

const router = express.Router();

router.post("/register", validate(RegisterDto), authController.register);
router.post("/login", validate(LoginDto), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

export default router;
