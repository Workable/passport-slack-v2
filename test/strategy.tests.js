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
    strategy.profileUrl.should.eql('https://slack.com/api/users.info');
    done();
  });

  describe('userProfile(accessToken, done)',  () => {
    context('with [\'users:read\', \'users:read.email\'] user_scope',  () => {
      before(() => {
        var profile = require('./profile.json');
        nock('https://slack.com')
            .get(`/api/users.info?user=${profile.user.id}`)
            .reply(200, profile);
      });

      it('passes id, firstname, lastname and profile picture fields to callback',  (done) => {
        const options = {
          clientID: 'clientId',
          clientSecret: 'clientSecret',
          scope: [],
          user_scope: ['users:read', 'users:read.email']
        };
        const accessToken = {
          user: {
            access_token: '8badf00d',
            expires_in: 1,
            user_id: 'W012A3CDE'
          }
        }
        const strategy = new Strategy(options,  () => {});
        strategy.userProfile(accessToken,  (err, profile) => {
          should.not.exist(err);
          profile.id.should.eql('W012A3CDE');
          profile.team_id.should.eql('T012AB3C4');
          profile.name.givenName.should.eql('Egon');
          profile.name.familyName.should.eql('Spengler');
          profile.displayName.should.eql('spengler');
          profile.photos.should.eql([
            { value: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg' },
            { value: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df51.jpg' },
            { value: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df52.jpg' },
            { value: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df53.jpg' },
            { value: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df54.jpg' },
            { value: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df55.jpg' },
            { value: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df56.jpg' }
          ]);
          profile.emails.should.eql([{
            value: 'spengler@ghostbusters.example.com',
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
