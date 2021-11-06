import mongoose, { Schema } from 'mongoose';
import { EModelNames, ETokenType, ITokenDocument } from '../types';
import { toJSON } from './plugins';

const tokenSchema: Schema<ITokenDocument> = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: EModelNames.USER,
      required: true,
    },
    type: {
      type: String,
      enum: [ETokenType.REFRESH, ETokenType.RESET_PASSWORD, ETokenType.VERIFY_EMAIL],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tokenSchema.plugin(toJSON);

const Token = mongoose.model<ITokenDocument>(EModelNames.TOKEN, tokenSchema);

export default Token;
