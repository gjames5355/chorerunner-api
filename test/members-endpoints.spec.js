const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe(`Members Endpoints`, () => {
  let db;

  const { testUsers, testHouseholds, testMembers } = helpers.makeFixtures();

  const testUser = testUsers[0];
  const testHousehold = testHouseholds[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  before('cleanup', () => helpers.cleanTables(db));
  afterEach('cleanup', () => helpers.cleanTables(db));
  after('disconnect from db', () => db.destroy());

  describe(`GET api/households/:householdId/members with members`, () => {
    context(`Households have some members`, () => {
      beforeEach('insert members', () => {
        helpers.seedChoresTables(db, testUsers, testHouseholds, testMembers);
      });

      it(`returns with a 200 status and an array with all members of household`, () => {
        const expectedMembers = testMembers;
        return supertest(app)
          .get(`/api/households/${testHousehold.id}/members`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedMembers);
      });
    });
  });
});
