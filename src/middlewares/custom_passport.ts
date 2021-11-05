import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { config } from '../config';

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: 'http://localhost:3000/api/auth/google/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, cb) => {
  return cb(null, profile);
}));


/**
 * Facebook strategy
 */
passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: 'http://localhost:3000/api/auth/facebook-callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, cb) => {
  console.log(profile)
  return cb(null, profile);
}));