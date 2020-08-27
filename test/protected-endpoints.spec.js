const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Protected endpoints', function () {
  let db;

  const {
    testUsers,
    testHouseholds,
    testMembers,
    testTasks,
  } = helpers.makeFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  beforeEach('insert tables', () =>
    helpers.seedChoresTables(
      db,
      testUsers,
      testHouseholds,
      testMembers,
      testTasks
    )
  );

  const protectedEndpoints = [
    // GET and POST households
    {
      name: 'GET /api/households',
      path: '/api/households',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/households',
      path: '/api/households',
      method: supertest(app).post,
    },
    // GET and POST household tasks
    {
      name: 'GET /api/households/:householdId/tasks',
      path: '/api/households/1/tasks',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/households/:householdId/tasks',
      path: '/api/households/1/tasks',
      method: supertest(app).post,
    },
    // GETs all members of the household
    {
      name: 'GET /api/households/:householdId/members',
      path: '/api/households/1/members',
      method: supertest(app).get,
    },
    // POSTs a member to a household
    {
      name: 'POST /api/households/:householdId/members',
      path: '/api/households/1/members',
      method: supertest(app).post,
    },
  ];

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it("responds 401 'Missing bearer token' when no bearer token", () => {
        return endpoint
          .method(endpoint.path)
          .expect(401, { error: 'Missing bearer token' });
      });

      it("responds 401 'Unauthorized request' when invalid JWT secret", () => {
        const validUser = testUsers[0];
        const invalidSecret = 'bad-secret';
        return endpoint
          .method(endpoint.path)
          .set(
            'Authorization',
            helpers.makeAuthHeader(validUser, invalidSecret)
          )
          .expect(401, { error: 'Unauthorized request' });
      });

      it("responds 401 'Unauthorized request' when invalid sub in payload", () => {
        const invalidUser = { username: 'user-not-existy', id: 1 };
        return endpoint
          .method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
});
