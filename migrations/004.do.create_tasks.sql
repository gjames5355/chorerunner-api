CREATE TYPE statuscode as ENUM ('assigned', 'completed', 'approved');
CREATE TABLE "tasks" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "household_id" INTEGER REFERENCES "households"(id) ON DELETE CASCADE NOT NULL,
  "user_id" INTEGER REFERENCES "users"(id) ON DELETE CASCADE NOT NULL,
  "member_id" INTEGER REFERENCES "members"(id) ON DELETE CASCADE NOT NULL,
  "points" SMALLINT NOT NULL,
  "status" statuscode DEFAULT 'assigned' NOT NULL
);