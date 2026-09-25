-- Runs once when the Postgres container is first created.
-- A separate database for integration tests, so they never touch dev data.
CREATE DATABASE chroniccare_test;
