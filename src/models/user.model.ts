import { Schema, model, Model, ObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import { toJSON, paginate } from './plugins';
import { EGender, EModelNames, EUserRole, IPaginateOption, IUserDocument } from '../types';

interface IUserModel extends Model<IUserDocument> {
  // statics
  isEmailTaken?: (email: string, excludeUserId?: ObjectId) => Promise<boolean>;
  paginate?: (filter: IUserDocument, options: IPaginateOption) => Promise<[any, any]>;
}

const userSchema: Schema = new Schema(
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

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email: string, excludeUserId: ObjectId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
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

/**
 * @typedef User
 */
const User = model<IUserDocument, IUserModel>(EModelNames.USER, userSchema);

export default User;
