CREATE TABLE "households" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "user_id" INTEGER references "users"(id) ON DELETE CASCADE NOT NULL
);