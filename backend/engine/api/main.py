from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from engine.api.config import settings
from engine.api.routers import images
from engine.api.db.base import Base
from engine.api.db.session import engine

# Create tables in database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS - allows your React frontend to talk to the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(images.router)

@app.get("/")
def root():
    return {"message": "Viper Protection API is running"}