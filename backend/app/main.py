from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import interview, avatar,  technical_interview, file_upload, system_design_interview, stripe_routes, schedule_interview, feedback, resume_upload
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://prepper-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the interview route
app.include_router(interview.router, prefix="/api")
app.include_router(avatar.router, prefix="/api")
app.include_router(technical_interview.router, prefix="/api")
app.include_router(file_upload.router, prefix='/api')
app.include_router(system_design_interview.router, prefix='/api')
app.include_router(stripe_routes.router, prefix='/api')
app.include_router(schedule_interview.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(resume_upload.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Hello from the AI Mock Interview platform!"}


