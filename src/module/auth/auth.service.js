import ApiError from "../../common/utils/Api-error.js";
import { hashPass, comparePass } from "../../common/utils/password.utils.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../common/utils/jwt-utils.js";
import { pool } from "../../../index.mjs";
import dotenv from "dotenv";

dotenv.config();

const register = async ({ username, password }) => {

    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username])

    if (user.rowCount > 0) {
        throw ApiError.conflict("User already exists");
    }


    const hashedPassword = await hashPass(password);
    const result = await pool.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *", [username, hashedPassword]);

    const payload = {
        id: result.rows[0].id,
        username: result.rows[0].username
    }

    return {
        user: payload,
    };

};


const login = async ({ username, password }) => {
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username])

    if (user.rowCount === 0) {
        throw ApiError.unauthorized("User not found");
    }

    const isPasswordValid = await comparePass(password, user.rows[0].password);

    if (!isPasswordValid) {
        throw ApiError.unauthorized("Invalid credentials");
    }

    const payload = {
        id: user.rows[0].id,
        username: user.rows[0].username
    };

    const accessToken = generateAccessToken(user.rows[0].id);
    const refreshToken = generateRefreshToken(user.rows[0].id);

    return {
        user: payload,
        accessToken,
        refreshToken
    };
}

const refreshAccessToken = async (oldRefreshToken) => {
    if (!oldRefreshToken) {
        throw ApiError.unauthorized("No refresh token provided");
    }
    
    try {
        const decoded = verifyRefreshToken(oldRefreshToken);
        const userId = decoded.payload;
        
        // Verify user still exists
        const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
        if (user.rowCount === 0) {
            throw ApiError.unauthorized("User not found");
        }
        
        // Generate new access token
        const newAccessToken = generateAccessToken(userId);
        
        // Generate new refresh token (rotation)
        const newRefreshToken = generateRefreshToken(userId);
        
        return {
            newAccessToken,
            newRefreshToken
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw ApiError.unauthorized("Refresh token expired");
        }
        throw ApiError.unauthorized("Invalid refresh token");
    }
};

export default {
    register,
    login,
    refreshAccessToken
};
