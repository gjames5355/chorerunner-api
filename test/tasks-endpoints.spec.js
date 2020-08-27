const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Tasks Endpoints', () => {
  let db;

  const {
    testUsers,
    testHouseholds,
    testMembers,
    testTasks,
  } = helpers.makeFixtures();

  const testUser = testUsers[0];
  const testMember = testMembers[0];
  const testHousehold = testHouseholds[0];
  const testTask = testTasks[0];

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

  describe('GET /api/households/:householdId/tasks as authorized user', () => {
    context('No tasks for any members', () => {
      beforeEach('insert members but no tasks', () => {
        return helpers.seedChoresTables(
          db,
          testUsers,
          testHouseholds,
          testMembers
        );
      });

      it('responds with a 200 and an empty array', () => {
        return supertest(app)
          .get(`/api/households/${testHousehold.id}/tasks`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200);
      });
    });

    context('Some tasks for a member', () => {
      beforeEach('insert members and tasks', () => {
        return helpers.seedChoresTables(
          db,
          testUsers,
          testHouseholds,
          testMembers,
          testTasks
        );
      });

      it('responds with a 204', () => {
        return supertest(app)
          .get(`/api/households/${testHousehold.id}/tasks`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect(res => {
            expect(res.body).to.be.a('object');
          });
      });
    });
  });

  describe('POST /api/households/:householdId/tasks as authorized user', () => {
    beforeEach('insert members', () => {
      return helpers.seedChoresTables(
        db,
        testUsers,
        testHouseholds,
        testMembers
      );
    });

    context(`Given when one request body is missing`, () => {
      it(`responds with 400 'Missing task name, member id or points in request body' when title missing`, () => {
        const tasksMissingTitle = {
          member_id: 1,
          points: 5,
        };
        return supertest(app)
          .post('/api/households/:id/tasks')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send(tasksMissingTitle)
          .expect(400, {
            error: {
              message: 'Missing task name, member id or points in request body',
            },
          });
      });

      it(`responds with 400 'Missing task name, member id or points in request body' when member_id missing`, () => {
        const tasksMissingMember = {
          title: 'title',
          points: 5,
        };
        return supertest(app)
          .post('/api/households/:id/tasks')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send(tasksMissingMember)
          .expect(400, {
            error: {
              message: 'Missing task name, member id or points in request body',
            },
          });
      });

      it(`responds with 400 'Missing task name, member id or points in request body' when points missing`, () => {
        const tasksMissingPoints = {
          member_id: 1,
          title: 'title',
        };
        return supertest(app)
          .post('/api/households/:id/tasks')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send(tasksMissingPoints)
          .expect(400, {
            error: {
              message: 'Missing task name, member id or points in request body',
            },
          });
      });
    });

    context(`Given when we have correct values in req.body`, () => {
      it('responds with 201 when POSTs successfully', () => {
        const fullTaskBody = {
          title: 'test-title',
          member_id: 1,
          points: 5,
        };
        const householdId = 1;
        return supertest(app)
          .post(`/api/households/${householdId}/tasks`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send(fullTaskBody)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(fullTaskBody.title);
            expect(res.body.member_id).to.eql(fullTaskBody.member_id);
            expect(res.body.points).to.eql(fullTaskBody.points);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(
              `/api/households/${householdId}/tasks`
            );
          });
      });

      it('filters XSS content', () => {
        const { maliciousTask, expectedTask } = helpers.makeMaliciousTask(
          testUser,
          testHousehold,
          testMember
        );

        return supertest(app)
          .post(`/api/households/${testHousehold.id}/tasks`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(maliciousTask)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(maliciousTask.title);
            expect(res.body.member_id).to.eql(maliciousTask.member_id);
            expect(res.body.points).to.eql(maliciousTask.points);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(
              `/api/households/${testHousehold.id}/tasks`
            );
          });
      });
    });
  });

  describe('PATCH /api/households/:householdId/tasks as authorized user', () => {
    context('Given the task is in the database', () => {
      beforeEach('insert tasks', () => {
        return helpers.seedChoresTables(
          db,
          testUsers,
          testHouseholds,
          testMembers,
          [testTask]
        );
      });

      context('Given the request include method:title', () => {
        it('responds with 204 and updates task title', () => {
          const updateTask = {
            id: testTask.id,
            method: 'title',
            title: 'testing',
            points: 90000,
          };

          //Expected task maintains original points but updates title.
          const expectedTask = {
            id: testTask.id,
            title: updateTask.title,
            points: testTask.points,
          };

          return supertest(app)
            .patch(`/api/households/${testHousehold.id}/tasks`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(updateTask)
            .expect(200, 'title updated')
            .then(() =>
              supertest(app)
                .get(`/api/households/${testHousehold.id}/tasks`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(res => {
                  expect(res.body).to.be.a('object');
                  expect(res.body[1].tasks).to.be.a('array');
                  expect(res.body[1].tasks[expectedTask.id - 1]).to.have.keys([
                    'id',
                    'points',
                    'status',
                    'title',
                  ]);
                  expect(res.body[1].tasks[expectedTask.id - 1].title).to.eql(
                    expectedTask.title
                  );
                  expect(res.body[1].tasks[expectedTask.id - 1].points).to.eql(
                    expectedTask.points
                  );
                })
            );
        });

        it('can filter out an xss attack', () => {
          const { maliciousTask, expectedTask } = helpers.makeMaliciousTask(
            testUser,
            testHousehold,
            testMember
          );

          const updateTask = {
            id: testTask.id,
            method: 'title',
            title: maliciousTask.title,
          };

          return supertest(app)
            .patch(`/api/households/${testHousehold.id}/tasks`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(updateTask)
            .expect(200, 'title updated')
            .then(() =>
              supertest(app)
                .get(`/api/households/${testHousehold.id}/tasks`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(res => {
                  expect(res.body[1].tasks[expectedTask.id - 1].title).to.eql(
                    expectedTask.title
                  );
                })
            );
        });
      });

      context('Given the request includes method:points', () => {
        it('responds with 204 and updates task points', () => {
          const newPoints = testTask.points + 5;

          const updateTask = {
            id: testTask.id,
            method: 'points',
            points: newPoints,
            title: 'I am breaking your server open like a coconut',
          };

          const expectedTask = {
            id: testTask.id,
            title: testTask.title,
            points: updateTask.points,
          };

          return supertest(app)
            .patch(`/api/households/${testHousehold.id}/tasks`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(updateTask)
            .expect(200, 'points updated')
            .then(() =>
              supertest(app)
                .get(`/api/households/${testHousehold.id}/tasks`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(res => {
                  expect(res.body).to.be.a('object');
                  expect(res.body[1].tasks).to.be.a('array');
                  expect(res.body[1].tasks[expectedTask.id - 1]).to.have.keys([
                    'id',
                    'points',
                    'status',
                    'title',
                  ]);
                  expect(res.body[1].tasks[expectedTask.id - 1].points).to.eql(
                    expectedTask.points
                  );
                  expect(res.body[1].tasks[expectedTask.id - 1].title).to.eql(
                    expectedTask.title
                  );
                })
            );
        });
      });
    });
  });
});
