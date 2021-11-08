import jwt from 'jsonwebtoken';
import { ETokenType } from "..";
import { Request } from "express"

export interface IAppRequest extends Request {
  user?: string;
}

export interface ITokenPayload extends jwt.JwtPayload {
  type?: ETokenType
}