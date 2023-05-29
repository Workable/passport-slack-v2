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

  var {
    user: {
      id,
      team_id,
      profile: {
        first_name: givenName,
        last_name: familyName,
        display_name: displayName,
        email,
        ...rest
      },
      is_email_confirmed
    }
  } = json;

  var profile = {
    id,
    team_id,
    displayName,
    name: { familyName, givenName }
  };

  var photos = Object.entries(rest)
      .filter(([k,_]) => /^image_(\d+|original)$/.test(k))
      .map(([_, value]) => ({ value }))
  if(photos.length)
    profile.photos = photos;
  if(email)
    profile.emails = [{ value: email, verified: is_email_confirmed }];

  return profile;
};
