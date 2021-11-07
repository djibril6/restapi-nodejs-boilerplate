import moment from 'moment';
import { config } from '../../src/config';
import { tokenService } from '../../src/services';
import { ETokenType } from '../../src/types';
import { userUtil } from '.';

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userUtil.userOne._id.toString(), accessTokenExpires, ETokenType.ACCESS);
const adminAccessToken = tokenService.generateToken(userUtil.admin._id.toString(), accessTokenExpires, ETokenType.ACCESS);

export default {
  userOneAccessToken,
  adminAccessToken
};
