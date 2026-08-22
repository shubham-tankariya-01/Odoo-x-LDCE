# Backend Status & Known Issues

Based on the latest test run, **all 12 unit tests passed successfully**. The core application logic, routing, and security layers are currently functioning as expected in isolation.

However, since you requested a report of what is "broken" or pending, here is a summary of the known architectural gaps and potential issues moving forward:

## 1. Database Integration is Untested
- **Issue:** The API endpoints rely on `sqlalchemy.ext.asyncio.AsyncSession` for database queries. Because the DB Engineer has not yet provided the schema migrations or a running PostgreSQL instance, our current `pytest` suite relies heavily on `MagicMock` and `AsyncMock` to simulate database responses.
- **Impact:** We cannot guarantee that the SQLAlchemy queries (e.g., complex filters in `/cities` or `/activities`) are perfectly syntactically correct against a real Postgres database until true integration tests are run.

## 2. Passlib vs. Bcrypt Compatibility
- **Issue:** The original implementation plan specified using `passlib[bcrypt]` for password hashing. However, `passlib` is currently unmaintained and throws exceptions when used with modern versions of `bcrypt` (`>= 4.0.0`).
- **Impact:** I have already refactored `backend/core/security.py` to use `bcrypt` natively to fix the crash. However, `passlib[bcrypt]` remains in `requirements.txt`. It is functional but adds unnecessary dead weight.

## 3. Engineer 2 Contracts (Stubbed)
- **Issue:** The `/search?q=` endpoint is currently hardcoded to return `trips: []`.
- **Impact:** This is expected behavior for Phase 5 per the integration plan, but it is technically a "missing feature" until Engineer 2 completes their trips search logic and we integrate it.

## 4. Stretch Goals (Empty Routes)
- **Issue:** The `community` and `admin` API routes are currently empty router stubs (`backend/api/routes/community.py` and `backend/api/routes/admin.py`).
- **Impact:** Calling any of the community or admin endpoints documented in the schema will currently result in a `404 Not Found`.

---

**Next Steps:**
Since there are no code-level crashes or test failures at the moment, no code changes are strictly required right now. Once a database is provisioned, we should replace the mock tests with a real test DB.
