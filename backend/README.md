# GlobeTrotter Backend

This is the backend implementation for GlobeTrotter, built with Python, FastAPI, SQLAlchemy, and Pydantic.

## Getting Started

### Prerequisites

- Python 3.11+
- Pip (Python Package Installer)

### Installation & Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   Copy the example environment file and configure your database settings and JWT secret key:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and verify that the settings match your target database and environment:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/globetrotter
   JWT_SECRET_KEY=your_secure_random_key_here
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

### Running the Server

Run the development server using `uvicorn` from the **project root directory** (so modules are resolved correctly):

```bash
# From project root directory
.\backend\venv\Scripts\uvicorn backend.main:app --reload
```

Alternatively, if your environment is activated:
```bash
# From project root directory
uvicorn backend.main:app --reload
```

The API docs will be available at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Running Tests

To run the unit tests, execute pytest from the **project root directory**:

```bash
uvicorn backend.main:app --reload   # Verify server is working first
# Run tests
pytest
```
