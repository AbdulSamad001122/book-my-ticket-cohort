import authService from "./auth.service.js";
import ApiResponse from "../../common/utils/Api-response.js";

const register = async (req, res) => {
    const user = await authService.register(req.body);
    ApiResponse.created(res, "Registration success", user);
};

const login = async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.ok(res, "Login successful", { user, accessToken });
};

const refreshToken = async (req, res) => {
    const token = req.cookies?.refreshToken;

    const newAccessToken = await authService.refreshAccessToken(token);

    ApiResponse.ok(res, "Token refreshed successfully", { accessToken: newAccessToken });
};

const logout = async (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    ApiResponse.ok(res, "Logged out successfully", {});
};

export default {
    register,
    login,
    refreshToken,
    logout
};
