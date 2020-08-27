const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Households Endpoints', function () {
  let db;

  const {
    testUsers,
    testHouseholds,
    testMembers,
    testTasks,
  } = helpers.makeFixtures();

  const testUser = testUsers[0];

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

  describe(`GET /api/households`, () => {
    context(`Given no households`, () => {
      before('seed users', () => helpers.seedUsers(db, testUsers));
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .then(res => {
            expect(res.body).to.be.an('array');
            expect(res.body).to.eql([]);
          });
      });
    });
    context(`Given households exist`, () => {
      beforeEach('insert households', () => {
        helpers.seedHouseholds(db, testUsers, testHouseholds);
      });

      afterEach('cleanup', () => helpers.cleanTables(db));

      it(`responds with 200 and an array with all the households`, () => {
        const expectedHouseholds = testHouseholds.map(household =>
          helpers.makeExpectedHousehold(testUsers, household)
        );
        return supertest(app)
          .get('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedHouseholds);
      });
    });

    context(`Given an XSS attack household`, () => {
      const testUser = helpers.makeUsersArray()[1];
      const {
        maliciousHousehold,
        expectedHousehold,
      } = helpers.makeMaliciousHousehold(testUser);

      beforeEach('insert malicious household', () => {
        return helpers.seedMaliciousHousehold(db, testUser, maliciousHousehold);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/households`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body[0].name).to.eql(expectedHousehold.name);
          });
      });
    });
  });

  describe(`GET /api/households`, () => {
    context(`Given no household`, () => {
      before('seed users', () => helpers.seedUsers(db, testUsers));
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .then(res => {
            expect(res.body).to.be.an('array');
            expect(res.body).to.eql([]);
          });
      });
    });

    context('Given there are households in the database', () => {
      beforeEach('insert households', () =>
        helpers.seedHouseholds(db, testUsers, testHouseholds)
      );

      it('responds with 200 and all of the households', () => {
        const expectedhouseholds = testHouseholds.map(household =>
          helpers.makeExpectedHousehold(testUsers, household)
        );
        return supertest(app)
          .get('/api/households')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedhouseholds);
      });
    });

    context(`Given an XSS attack household`, () => {
      const testUser = helpers.makeUsersArray()[1];
      const {
        maliciousHousehold,
        expectedHousehold,
      } = helpers.makeMaliciousHousehold(testUser);

      beforeEach('insert malicious household', () => {
        return helpers.seedMaliciousHousehold(db, testUser, maliciousHousehold);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/households`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body[0].name).to.eql(expectedHousehold.name);
          });
      });
    });
  });

  describe('POST /api/households', () => {
    context(`POST tests`, () => {
      beforeEach('seed users', () => helpers.seedUsers(db, testUsers));
      it(`creates a household, responding with 201 and a new household`, () => {
        const newHousehold = {
          name: 'Test',
        };
        return supertest(app)
          .post(`/api/households`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newHousehold)
          .expect(201)
          .expect(res => {
            expect(res.body.name).to.eql(newHousehold.name);
            expect(res.body).to.have.property('id');
          });
      });
    });

    context(`Given an XSS attack on household`, () => {
      const testUser = helpers.makeUsersArray()[1];
      const {
        maliciousHousehold,
        expectedHousehold,
      } = helpers.makeMaliciousHousehold(testUser);

      beforeEach('insert malicious household', () => {
        return helpers.seedMaliciousHousehold(db, testUser, maliciousHousehold);
      });

      it('removes XSS attack content from household', () => {
        return supertest(app)
          .post(`/api/households`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(maliciousHousehold)
          .expect(201)
          .expect(res => {
            expect(res.body.name).to.eql(expectedHousehold.name);
          });
      });
    });
  });

  describe('PATCH /api/households/:id', () => {
    context(`PATCH household endpoint tests`, () => {
      before('seed users', () => helpers.seedUsers(db, testUsers));
      it('responds with 404', () => {
        const householdId = 999;
        return supertest(app)
          .patch(`/api/households/${householdId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: `Household doesn't exist` });
      });
    });
    context('Given there are households in the database', () => {
      beforeEach('insert household', () => {
        return helpers.seedChoresTables(
          db,
          testUsers,
          testHouseholds,
          testMembers,
          testTasks
        );
      });
      it('responds with 200 and updates household', () => {
        const idToUpdate = 2;
        const updateHousehold = {
          name: 'Test',
        };
        return supertest(app)
          .patch(`/api/households/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updateHousehold)
          .expect(200);
      });
    });
  });

  context(`Given an XSS attack on household`, () => {
    const testUser = helpers.makeUsersArray()[1];
    const {
      maliciousHousehold,
      expectedHousehold,
    } = helpers.makeMaliciousHousehold(testUser);

    beforeEach('insert malicious household', () => {
      return helpers.seedMaliciousHousehold(db, testUser, maliciousHousehold);
    });

    it('removes XSS attack content from household', () => {
      return supertest(app)
        .post(`/api/households`)
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .send(maliciousHousehold)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(expectedHousehold.name);
        });
    });
  });

  describe(`DELETE /api/households/:id`, () => {
    before('seed users', () => helpers.seedUsers(db, testUsers));
    context('Given no households', () => {
      it('responds with 404', () => {
        const householdId = 999;
        return supertest(app)
          .delete(`/api/households/${householdId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: `Household doesn't exist` });
      });
    });
  });
});
