var should = require('should');
var nock = require('nock');
var Strategy = require('../lib/index').Strategy;

nock.disableNetConnect();

describe('slack strategy', () => {
  it('sanity check',(done) => {
    const options = {
      clientID: 'clientId',
      clientSecret: 'clientSecret'
    };
    const strategy = new Strategy(options, () => {});
    strategy.name.should.eql('slack');
    strategy.profileUrl.should.eql('https://slack.com/api/openid.connect.userInfo');
    done();
  });

  describe('userProfile(accessToken, done)',  () => {
    context('with [\'openid\', \'email\', \'profile\'] user_scope',  () => {
      before(() => {
        nock('https://slack.com')
            .get('/api/openid.connect.userInfo')
            .reply(200, require('./profile.json'));
      });

      it('passes id, firstname, lastname and profile picture fields to callback',  (done) => {
        const options = {
          clientID: 'clientId',
          clientSecret: 'clientSecret',
          scope: [],
          user_scope: ['openid', 'email', 'profile']
        };
        const accessToken = {
          user: {
            access_token: '8badf00d',
            expires_in: 1
          }
        }
        const strategy = new Strategy(options,  () => {});
        strategy.userProfile(accessToken,  (err, profile) => {
          should.not.exist(err);
          profile.id.should.eql('U0R7JM');
          profile.team_id.should.eql('T0R7GR');
          profile.name.givenName.should.eql('Bront');
          profile.name.familyName.should.eql('Labradoodle');
          profile.displayName.should.eql('krane');
          profile.photos.should.eql([{
            value: 'https://secure.gravatar.com/....png'
          }]);
          profile.emails.should.eql([{
            value: 'krane@slack-corp.com',
            verified: true
          }]);
          done();
        });
      });
    });

    context('when error occurs',  () => {
      before( () => {
        nock('https://slack.com')
            .get(/api\/.*/)
            .reply(200, {
              "ok": false,
              "error": "some error"
            });
      });

      it('passes error to callback',  (done) => {
        const options = {
          clientID: 'clientId',
          clientSecret: 'clientSecret',
          scope: [],
          user_scope: []
        };
        const accessToken = {
          user: {
            access_token: '8badf00d',
            expires_in: 1
          }
        }
        const strategy = new Strategy(options, () => {});
        strategy.userProfile(accessToken,  (err, profile) => {
          should.exist(err);
          should.not.exist(profile);
          done();
        });
      });
    });
  });
});
