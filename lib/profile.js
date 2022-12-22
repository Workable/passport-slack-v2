/**
 * Parse profile.
 *
 * @param {object|string} json
 * @return {object}
 * @access public
 */
exports.parse = function(json) {
  if (typeof json === 'string') {
    json = JSON.parse(json);
  }

  var profile = {};
  profile.id = json.sub;
  profile.team_id = json[Object.keys(json).find(k => /team_id/.test(k))];
  profile.displayName = json.name;
  profile.name = { familyName: json.family_name, givenName: json.given_name };

  if (json.email && json.email_verified) {
    profile.emails = [{ value: json.email, verified: json.email_verified }];
  }
  if (json.picture) {
    profile.photos = [{ value: json.picture }];
  }

  return profile;
};
