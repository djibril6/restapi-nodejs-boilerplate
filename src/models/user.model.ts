import { Schema, model, Model, FilterQuery } from 'mongoose';
import bcrypt from 'bcryptjs';
import { toJSON, paginate } from './plugins';
import { EGender, EModelNames, EUserRole, IPaginateOption, IUserDocument } from '../types';

interface IUserModel extends Model<IUserDocument> {
  // statics
  isEmailTaken?: (email: string, excludeUserId?: string) => Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginate?: (filter: FilterQuery<IUserDocument>, options: IPaginateOption) => Promise<[IUserDocument, any]>;
}

const userSchema: Schema<IUserDocument> = new Schema(
  {
    firstname: {
      type: String,
      trim: true,
    },
    lastname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: EGender,
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      // used by the toJSON plugin
      private: true,
    },
    role: {
      type: String,
      enum: EUserRole,
      default: EUserRole.USER,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    accountClosed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 */
userSchema.statics.isEmailTaken = async function (email: string, excludeUserId: string) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 */
userSchema.methods.isPasswordMatch = async function (password: string) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;
  return bcrypt.compare(password, user.get('password'));
};

userSchema.pre('save', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;
  if (user.isModified('password')) {
    const hashedPass = await bcrypt.hash(user.get('password'), 8);
    user.set('password', hashedPass);
  }
  next();
});

const User = model<IUserDocument, IUserModel>(EModelNames.USER, userSchema);

export default User;
