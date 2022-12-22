# passport-slack-v2

[Passport](https://github.com/Workable/passport-slack-v2) strategy for authenticating
with [Slack](https://slack.com) using the [V2](https://api.slack.com/authentication/oauth-v2) OAuth 2.0 API.

Updated to support Sign in with Slack by default.

[![Sign in with Slack](https://a.slack-edge.com/accd8/img/sign_in_with_slack.png)](https://api.slack.com/docs/sign-in-with-slack#identify_users_and_their_teams)

## Install

```shell
$ npm install @workablehr/passport-slack-v2
```


## Express Example
```js
const {CLIENT_ID, CLIENT_SECRET, PORT} = process.env,
      SlackStrategy = require('passport-slack-v2').Strategy,
      passport = require('passport'),
      express = require('express'),
      app = express();

// setup the strategy using defaults 
passport.use(new SlackStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET
  }, (accessToken, refreshToken, profile, done) => {
    // optionally persist profile data
    done(null, profile);
  }
));

const app = express();
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

// path to start the OAuth flow
app.get('/auth/slack', passport.authorize('slack'));

// OAuth callback url
app.get('/auth/slack/callback', 
  passport.authorize('slack', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/')
);

app.listen(PORT);
```

## Sample Profile
```json
{
  "ok": true,
  "sub": "U0R7JM",
  "https://slack.com/user_id": "U0R7JM",
  "https://slack.com/team_id": "T0R7GR",
  "email": "krane@slack-corp.com",
  "email_verified": true,
  "date_email_verified": 1622128723,
  "name": "krane",
  "picture": "https://secure.gravatar.com/....png",
  "given_name": "Bront",
  "family_name": "Labradoodle",
  "locale": "en-US",
  "https://slack.com/team_name": "kraneflannel",
  "https://slack.com/team_domain": "kraneflannel",
  "https://slack.com/user_image_24": "...",
  "https://slack.com/user_image_32": "...",
  "https://slack.com/user_image_48": "...",
  "https://slack.com/user_image_72": "...",
  "https://slack.com/user_image_192": "...",
  "https://slack.com/user_image_512": "...",
  "https://slack.com/team_image_34": "...",
  "https://slack.com/team_image_44": "...",
  "https://slack.com/team_image_68": "...",
  "https://slack.com/team_image_88": "...",
  "https://slack.com/team_image_102": "...",
  "https://slack.com/team_image_132": "...",
  "https://slack.com/team_image_230": "...",
  "https://slack.com/team_image_default": true
}

```

## Usage

### Configure the Strategy

The Slack authentication strategy authenticates users using a Slack
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a client ID, client secret, and callback URL.

```js
passport.use(new SlackStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    skipUserProfile: false, // default
    scope: [],
    user_scope: [],
    passReqToCallback: true
  },
  (accessToken, refreshToken, profile, done) => {
    // optionally persist user data into a database
    done(null, profile);
  }
));
```

### Authentication Requests

Use `passport.authenticate()` (or `passport.authorize()` if you want to authenticate with Slack and **NOT** affect `req.user` and the user session), specifying the `'slack'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/slack', passport.authorize('Slack'));

app.get('/auth/slack/callback',
  passport.authenticate('slack', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/') // Successful authentication, redirect home.
);
```

### Custom Scopes
#### User Scopes
By default, the passport-slack-v2 strategy attempts to retrieve [the user's identity](https://api.slack.com/methods/openid.connect.userInfo) from Slack. This action requires at least the following scopes `openid`, `email`, and `profile`.

```js
passport.use(new SlackStrategy({
	clientID: CLIENT_ID,
	clientSecret: CLIENT_SECRET,
	user_scope: ['openid', 'email', 'profile']
}, () => { }));
```

#### Bot Scopes
For bot scopes, set the `scope` parameter to an array of the desired scopes.
```js
passport.use(new SlackStrategy({
	clientID: CLIENT_ID,
	clientSecret: CLIENT_SECRET,
	scope: ['channels:manage', 'groups:write', 'im:write', 'mpim:write']
}, () => { }));
```

### Ignore Profile Info
If you only need an access token and no user profile data, you can avoid getting profile information by setting `skipUserProfile` to true.
```js
passport.use(new SlackStrategy({
	clientID: CLIENT_ID,
	clientSecret: CLIENT_SECRET,
	scope: ['incoming-webhook'],
	skipUserProfile: true
}, () => { });
```

## Thanks
- [Jared Hanson](http://github.com/jaredhanson)
- [Michael Pearson](https://github.com/mjpearson)

## License

[The MIT License](http://opensource.org/licenses/MIT)
