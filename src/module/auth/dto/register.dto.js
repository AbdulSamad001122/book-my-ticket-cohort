import BaseDto from "../../../common/dto/base.dto.js";
import Joi from "joi";

export class RegisterDto extends BaseDto {
  static schema = Joi.object({
    username: Joi.string().trim().min(4).max(50).required(),
    password: Joi.string().min(8).message("Password must contain 8 chars minimum").required(),
  });
}
