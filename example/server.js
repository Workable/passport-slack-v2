
// API Access link for creating client ID and secret:
// https://api.slack.com/start
const { CLIENT_ID, CLIENT_SECRET } = process.env;
const PORT = process.env.PORT || 3000;
const CALLBACK_URL = process.env.CALLBACK_URL || `https://localhost:${PORT}/auth/slack/callback`;

const passport = require('passport');
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete Slack profile is
//   serialized and deserialized.
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const SlackStrategy = require('../lib').Strategy;
// Use the SlackStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Slack
//   profile), and invoke a callback with a user object.
passport.use(new SlackStrategy({
    clientID:     CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL:  CALLBACK_URL,
    scope:        [],
    user_scope:   ['users:read', 'users:read.email'],
    passReqToCallback: true
  },
  (req, accessToken, refreshToken, profile, done) => {
    // asynchronous verification, for effect...
    req.session.accessToken = accessToken;
    process.nextTick(() => {
      // To keep the example simple, the user's Slack profile is returned to
      // represent the logged-in user. In a typical application, you would want
      // to associate the Slack account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const ejsLayouts = require("express-ejs-layouts");
const session = require('express-session');

const app = express();
// configure Express
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(ejsLayouts);
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'keyboard cat',
    saveUninitialized: false,
    resave: false
}));
// Initialize Passport! Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

// GET /auth/slack
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Slack authentication will involve
//   redirecting the user to slack.com.  After authorization, Slack
//   will redirect the user back to this application at /auth/slack/callback
app.get('/auth/slack',
  passport.authenticate('slack', { state: 'SOME STATE' }),
  (req, res) => {
    // The request will be redirected to Slack for authentication, so this
    // function will not be called.
  });

// GET /auth/slack/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/slack/callback',
  passport.authenticate('slack', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  });

app.get('/login', (req, res) => {
    res.redirect('/auth/slack');
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
      if(err) {
          return next(err);
      }
      res.redirect('/');
  });
});

const https = require('https');
const fs = require('fs');
https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
},app).listen(PORT, () => {
    console.log(`server is running at port ${PORT}`);
});
