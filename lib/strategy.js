/**
 * Module dependencies.
 */
const util = require('util');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const { InternalOAuthError } = require('passport-oauth2');
const get = require('lodash.get');
const Profile = require('./profile');

/**
 * `Strategy` constructor.
 *
 * The Slack authentication strategy authenticates requests by delegating
 * to Slack using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 *
 * Options:
 *   - `clientID`               your Slack application's client id
 *   - `clientSecret`           your Slack application's client secret
 *   - `callbackURL`            URL to which Slack will redirect the user after granting authorization
 *   - `scope`                  array of permission scopes to request defaults to: []
 *                              full set of scopes: https://api.slack.com/scopes
 *
 * Examples:
 *
 *     passport.use(new SlackStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/slack/callback',
 *         scope: [],
 *         user_scope: ['openid', 'email', 'profile']
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL =
    options.authorizationURL || 'https://slack.com/oauth/v2/authorize';
  options.tokenURL =
    options.tokenURL || 'https://slack.com/api/oauth.v2.access';
  options.user_scope = options.user_scope || [];
  this.user_scope = options.user_scope;
  options.scope = options.scope || [];
  this.scope = options.scope;

  this.profileUrl =
    options.profileUrl || 'https://slack.com/api/users.info';
  this.team = options.team || '';

  OAuth2Strategy.call(this, options, verify);

  var getOAuthAccessToken = this._oauth2.getOAuthAccessToken;
  this._oauth2.getOAuthAccessToken = function(code, params, callback) {
    getOAuthAccessToken.call(this, code, params, function(
      error,
      access_token,
      refresh_token,
      results
    ) {
      if (!results.ok) {
        callback(results.error);
      } else {
        access_token = {
          user: {
            access_token: get(results, 'authed_user.access_token'),
            expires_in: get(results, 'authed_user.expires_in'),
            user_id: get(results, 'authed_user.id')
          },
          bot: {
            access_token,
            expires_in: results.expires_in,
            user_id: results.bot_user_id
          }
        };
        refresh_token = {
          user: get(results, 'authed_user.refresh_token'),
          bot: refresh_token
        };
        callback(null, access_token, refresh_token, results);
      }
    });
  };
  this.name = options.name || 'slack';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Slack.
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `Slack`
 *   - `id`               the user's ID
 *   - `team_id`          the workspace ID
 *   - `displayName`      the user's full name
 *   - `name`             an object containing the user's familyName & givenName
 *   - `emails`           an array of objects containing the user's emails
 *   - `photos`           an array of objects containing the user's photos
 *   - `_raw`             the raw response body
 *   - `_json`            the response body casted as a json string
 *
 * @param {Object} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.useAuthorizationHeaderforGET(true);
  const access_token = accessToken.user.access_token;
  const provider = this.name;
  const { user_id: user } = accessToken.user;
  this._oauth2.get(`${this.profileUrl}?user=${user}`, access_token, function(err, body, res) {
    if (err) {
      done(new InternalOAuthError('Failed to fetch user profile', err));
    } else {
      try {
        const json = JSON.parse(body);
        if (!json.ok) {
          done(json.error);
        } else {
          const profile = Profile.parse(json);
          profile.provider = provider;
          profile._raw = body;
          profile._json = json;
          done(null, profile);
        }
      } catch (ex) {
        done(new Error('Failed to parse user profile'));
      }
    }
  });
};

/**
 * Return extra Slack parameters to be included in the authorization
 * request.
 *
 * @param {Object} options
 * @return {Object}
 */
Strategy.prototype.authorizationParams = function(options) {
  const params = {};
  params.team = options.team || this.team;

  if (options.user_scope) {
    const user_scope = options.user_scope.split(this._scopeSeparator);
    params.user_scope = [...new Set(user_scope)].join(this._scopeSeparator);
  } else {
    const default_scope = this.scope.join(this._scopeSeparator);
    const scope = (options.scope || default_scope).split(this._scopeSeparator);
    params.scope = [...new Set(scope)].join(this._scopeSeparator);
    params.user_scope = this.user_scope.join(this._scopeSeparator);
  }
  return params;
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
