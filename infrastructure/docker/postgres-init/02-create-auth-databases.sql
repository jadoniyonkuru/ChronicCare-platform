-- Runs once when the Postgres container is first created.
-- auth-service owns its own databases; other services never read them.
CREATE DATABASE chroniccare_auth;
CREATE DATABASE chroniccare_auth_test;
