const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Users Endpoints', () => {
  let db;

  const {
    testUsers,
    testHouseholds,
    testMembers,
    testTasks,
  } = helpers.makeFixtures();

  const testUser = testUsers[0];

  before('Connect to DB before ALL tests', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  after('Disconnect from DB after ALL tests', () => db.destroy());

  before('Clear tables before ALL tests', () => helpers.cleanTables(db));

  afterEach('Clear table after EACH test', () => helpers.cleanTables(db));

  describe('POST /api/users/', () => {
    beforeEach('insert household', () =>
      helpers.seedChoresTables(
        db,
        testUsers,
        testHouseholds,
        testMembers,
        testTasks
      )
    );

    it('responds with 400 missing username if not supplied', () => {
      const userMissingUser = {
        name: 'Test User',
        password: 'AB123456',
      };
      return supertest(app)
        .post('/api/users')
        .send(userMissingUser)
        .expect(400, { error: "Missing 'username' in request body" });
    });

    it('responds with 400 missing name if not supplied', () => {
      const userMissingFullName = {
        username: 'test-user',
        password: 'AB123456',
      };
      return supertest(app)
        .post('/api/users')
        .send(userMissingFullName)
        .expect(400, { error: "Missing 'name' in request body" });
    });

    it('responds with 400 missing password if not supplied', () => {
      const userMissingPassword = {
        name: 'Test User',
        username: 'test-user',
      };
      return supertest(app)
        .post('/api/users')
        .send(userMissingPassword)
        .expect(400, { error: "Missing 'password' in request body" });
    });

    it('responds with 400 when password is less than 8 characters', () => {
      const newUser = {
        name: 'Test User',
        username: 'test-user',
        password: 'AB123',
      };
      return supertest(app)
        .post('/api/users')
        .send(newUser)
        .expect(400, { error: 'Password must be longer than 8 characters' });
    });

    it('responds with 400 when password is longer than 72 characters', () => {
      const newUser = {
        name: 'Test User',
        username: 'test-user',
        password:
          'AB1234P84O9q7MD28Z51JEK3lt3ny2EFcwC6rPOU37l20gUApC263L8Jr7Vi0c74uM3xXXFInBE4POBfct7Y6yOnUHSS41mR7B75IPyP83lgwvaVHvYgBHBKZLaLZ9IHqnRsc9sJyk7jeU',
      };
      return supertest(app)
        .post('/api/users')
        .send(newUser)
        .expect(400, { error: 'Password must be less than 72 characters' });
    });

    it('responds with 400 when password does not contain at least one uppercase, lowercase, and number character', () => {
      const newUser = {
        name: 'Test User',
        username: 'test-user',
        password: 'abcdefghi',
      };
      return supertest(app)
        .post('/api/users')
        .send(newUser)
        .expect(400, {
          error:
            'Password must contain one upper case, lower case, number and special character',
        });
    });

    it('respond with 400 when username is submitted that already exists', () => {
      const existingUser = {
        name: 'Test User',
        username: testUser.username,
        password: 'Ab123456!',
      };
      return supertest(app)
        .post('/api/users')
        .send(existingUser)
        .expect(400, { error: 'Username already taken' });
    });

    it('returns 201 and adds a new user', () => {
      const newUser = {
        username: 'test-user',
        name: 'Test User',
        password: 'Ab123456!',
      };

      return supertest(app)
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect(res => {
          expect(res.body.username).to.eql(newUser.username);
          expect(res.body.name).to.eql(newUser.name);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/users/${res.body.id}`);
        });
    });

    it('removes XSS attack content from response', () => {
      before('Insert users', () => {
        helpers.seedUsers(db, testUsers);
      });
      const maliciousUser = {
        name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        username: 'Naughty naughty very naughty <script>alert("xss");</script>',
        password:
          'Naughty1! naughty very naughty <script>alert("xss");</script>',
      };

      const expectedUser = {
        name:
          'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
        username:
          'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
        password:
          'Naughty1! naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
      };

      return supertest(app)
        .post('/api/users')
        .send(maliciousUser)
        .expect(201)
        .expect(res => {
          expect(res.body.full_name).to.eql(expectedUser.full_name);
          expect(res.body.user_name).to.eql(expectedUser.user_name);
          expect(res.body).to.have.property('id');
        });
    });
  });
});
