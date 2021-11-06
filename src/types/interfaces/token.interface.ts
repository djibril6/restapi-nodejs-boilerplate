import { ETokenType } from '..';
import mongoose from 'mongoose';

export interface ITokenDocument extends mongoose.Document {
  token: string;
  user: string | (() => string);
  type: ETokenType;
  expires: Date;
}