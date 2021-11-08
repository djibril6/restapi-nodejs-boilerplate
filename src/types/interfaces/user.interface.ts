import mongoose from 'mongoose';
import { EGender, EUserRole } from '..';

export interface IUserID {
  id: string;
};
export interface IFirstname {
  firstname: string;
};
export interface ILastname {
  lastname: string;
};
export interface IEmail {
  email: string;
};
export interface IGender {
  gender: EGender;
};
export interface IRole {
  role: EUserRole;
};
export interface IIsEmailVerified {
  isEmailVerified: boolean;
};
export interface IPassword {
  password: string;
}
export interface IStatus {
  accountClosed: boolean;
}

export interface IUser extends
  Partial<IFirstname>,
  Partial<ILastname>,
  Partial<IEmail>,
  Partial<IGender>,
  Partial<IRole>,
  Partial<IIsEmailVerified>,
  Partial<IStatus>,
  Partial<IPassword>
{}

export interface IUserDocument extends mongoose.Document, IUser
{
  isPasswordMatch?: (password: string) => Promise<boolean>;
}