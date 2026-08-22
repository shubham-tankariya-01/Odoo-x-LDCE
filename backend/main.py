from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import auth, users, catalog, search, community, admin, trips, sections, trip_activities, recommendations

app = FastAPI(title="GlobeTrotter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
# Catalog has no common prefix in endpoints (e.g. /cities and /activities)
app.include_router(catalog.router, tags=["Catalog"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(community.router, prefix="/community", tags=["Community"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])

# Engineer 2 routes
app.include_router(trips.router, tags=["Trips"])
app.include_router(sections.router, tags=["Sections"])
app.include_router(trip_activities.router, tags=["Trip Activities"])

@app.get("/")
async def root():
    return {"message": "Welcome to GlobeTrotter API"}
