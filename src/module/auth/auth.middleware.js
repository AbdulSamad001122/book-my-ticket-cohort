import { pool } from "../../../index.mjs";
import ApiError from "../../common/utils/Api-error.js";
import { verifyAccessToken } from "../../common/utils/jwt-utils.js";

const authenticate = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw ApiError.unauthorized("Not Autheticated");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw ApiError.unauthorized("Invalid or expired token");
  }
  
  const userId = decoded.payload;

  const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

  if (user.rowCount === 0) {
    throw ApiError.unauthorized("User not found");
  }

  req.user = user.rows[0];

  next()
};

export default authenticate;
