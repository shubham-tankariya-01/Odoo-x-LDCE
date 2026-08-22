# Implementation Plan: Live Database Integration & E2E Testing

This document details the strategy for migrating the test suite from heavily mocked `AsyncMock` fixtures to live Neon PostgreSQL integration tests, fulfilling the Future Testing Plan.

## Goal
1. Replace `mock_db_session` with a real SQLAlchemy `AsyncSession` fixture that executes raw queries against the database without mocking.
2. Ensure tests run safely (without permanently polluting the live development database) by using isolated test schemas or transaction rollbacks.
3. Write actual E2E database tests for the `/search` endpoint to verify the JSON structure.

## Proposed Strategy

> [!CAUTION]
> **Refactoring Risk:** All 32 existing tests currently use `mock_db_session.execute.return_value`. When we transition `mock_db_session` to be a real live database session, **all existing unit tests will fail and must be rewritten** to actually insert records via `session.add()` and verify API responses against the real DB. This is standard for integration testing, but it is a large refactor.

### 1. Database Fixture & Isolation Strategy
To prevent test data from polluting the main `neondb`, we will modify `conftest.py` to:
1. Connect to the `DATABASE_URL` specified in `.env`.
2. Use SQLAlchemy's `Base.metadata.create_all` to automatically generate the tables.
3. For each test, create a new nested transaction (SAVEPOINT) that is **rolled back** after the test completes. This ensures zero test contamination and keeps the DB clean.

#### [MODIFY] `backend/tests/conftest.py`
- Import all models so `Base.metadata` detects them.
- Introduce an asynchronous generator fixture `db_session` that handles nested transactions.
- Remove `mock_db_session`.

### 2. Rewriting Existing Tests
Since the mock dependency is removed, we must refactor all tests in:
- `test_auth.py`
- `test_users.py`
- `test_catalog.py`
- `test_search.py`
- `test_trips.py`
- `test_community.py`
- `test_admin.py`

*Example change:* Instead of mocking the DB response to return a fake city, the test will actually insert a city into the live Postgres database and then request it via `TestClient`.

### 3. Adding E2E Search Test

#### [MODIFY] `backend/tests/test_search.py`
- Create a test `test_global_search_e2e_live_db` that:
  - Inserts a `City` named "Tokyo".
  - Inserts a `Trip` containing "Tokyo" in the title (by the mock user).
  - Calls `GET /search?q=Tokyo`.
  - Verifies that both the `cities` array and `trips` array in the JSON response contain the inserted records with the correct relationships and UUIDs.

## Open Questions

> [!WARNING]
> **Action Required:** Before I begin this massive test rewrite, do you approve this approach? Are you okay with me rewriting all 32 tests to insert real data instead of using mocks? 

## Verification Plan
1. Run `pytest backend/tests/ -v`.
2. Ensure all 32 tests (including the new E2E search test) pass and successfully execute SQL against Neon DB.
3. Verify via `psql` or external inspection that the Neon database remains clean (no test data persists due to rollbacks).
