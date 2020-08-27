BEGIN;
TRUNCATE "tasks",
"levels_members",
"levels",
"members",
"households",
"users";
INSERT INTO "users"("id", "username", "password", "name")
VALUES (
    1,
    'admin',
    --pass
    '$2a$12$5CDxmf52iovOcAO9MVciv.6Wo7nId1olc4LOSURaKTnDvXLimQbkS',
    'dunder'
  );
INSERT INTO "households"("id", "name", "user_id")
VALUES (1, 'household1', 1),
  (2, 'household2', 1),
  (3, 'household3', 1);
INSERT INTO "members"(
    "id",
    "name",
    "username",
    "password",
    "user_id",
    "household_id",
    "total_score"
  )
VALUES (
    1,
    'kid1',
    'kid1',
    '$2a$12$5CDxmf52iovOcAO9MVciv.6Wo7nId1olc4LOSURaKTnDvXLimQbkS',
    1,
    1,
    0
  ),
  (
    2,
    'kid2',
    'kid2',
    '$2a$12$5CDxmf52iovOcAO9MVciv.6Wo7nId1olc4LOSURaKTnDvXLimQbkS',
    1,
    1,
    0
  ),
  (
    3,
    'kid3',
    'kid3',
    '$2a$12$5CDxmf52iovOcAO9MVciv.6Wo7nId1olc4LOSURaKTnDvXLimQbkS',
    1,
    2,
    0
  ),
  (
    4,
    'kid4',
    'kid4',
    '$2a$12$5CDxmf52iovOcAO9MVciv.6Wo7nId1olc4LOSURaKTnDvXLimQbkS',
    1,
    2,
    0
  );
INSERT INTO "tasks"(
    "id",
    "title",
    "household_id",
    "user_id",
    "member_id",
    "points",
    "status"
  )
VALUES (1, 'task1', 1, 1, 1, 5, 'assigned'),
  (2, 'task2', 1, 1, 2, 10, 'completed'),
  (3, 'task3', 1, 1, 2, 7, 'approved');
INSERT INTO "levels"("id", "badge")
VALUES (1, 'Badge1'),
  (2, 'Badge2'),
  (3, 'Badge3'),
  (4, 'Badge4'),
  (5, 'Badge5'),
  (6, 'Badge6'),
  (7, 'Badge7'),
  (8, 'Badge8'),
  (9, 'Badge9'),
  (10, 'Badge10');
--update the sequence
SELECT setval(
    'tasks_id_seq',
    (
      SELECT MAX(id)
      from "tasks"
    )
  );
SELECT setval(
    'members_id_seq',
    (
      SELECT MAX(id)
      from "members"
    )
  );
SELECT setval(
    'households_id_seq',
    (
      SELECT MAX(id)
      from "households"
    )
  );
SELECT setval(
    'users_id_seq',
    (
      SELECT MAX(id)
      from "users"
    )
  );
SELECT setval(
    'levels_id_seq',
    (
      SELECT MAX(id)
      from "levels"
    )
  );
COMMIT;
-- run script: psql -U dunder_mifflin -d chorerunner -f ./seeds/seed.tables.sql