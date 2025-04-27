from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import List, Optional, Dict, Any
import shutil
import os
import json

# Config
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# App & Mongo setup
app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:4200",  # Angular default
    "http://localhost:8080",  # Alternative dev port
    "http://127.0.0.1:4200",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get MongoDB connection string from environment variable or use default
mongo_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_uri)
db = client.user_db
users_collection = db.users
courses_collection = db.courses
lectures_collection = db.lectures

# Security & Auth
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Models
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

# Course and Lecture Models
class CourseBase(BaseModel):
    course_name: str

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    course_id: str

class LectureBase(BaseModel):
    lecture_name: str

class LectureCreate(LectureBase):
    pass

class LectureOut(LectureBase):
    lecture_id: str

class NoteCreate(BaseModel):
    title: str
    user_note: str = ""
    recording: str = ""
    transcript: str = ""

class LectureMaterial(BaseModel):
    note: Optional[str] = ""
    slides: Optional[str] = ""
    recording: Optional[str] = ""
    transcript: Optional[str] = ""
    ai_note: Optional[str] = ""

class CourseList(BaseModel):
    courses: List[CourseOut]

class LectureList(BaseModel):
    lectures: List[LectureOut]

# Utils
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# File storage paths
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audio")
SLIDES_DIR = os.path.join(UPLOAD_DIR, "slides")

# Create directories if they don't exist
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(SLIDES_DIR, exist_ok=True)

# File handling helpers
async def save_file(file: UploadFile, directory: str) -> str:
    """Save an uploaded file to a specified directory and return the file path"""
    # Create a unique filename based on timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{timestamp}{file_extension}"
    file_path = os.path.join(directory, safe_filename)
    
    # Write the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

# Routes
@app.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    existing = await get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    user_dict = {
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed_password,
    }

    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)

    return {
        "id": user_dict["_id"],
        "full_name": user_dict["full_name"],
        "email": user_dict["email"]
    }
class LoginInput(BaseModel):
    username: str
    password: str

@app.post("/login", response_model=Token)
async def login(form_data: LoginInput):
    user = await get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(data={"sub": user["email"]}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=UserOut)
async def me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"]
    }

# Course and Lecture routes
@app.get("/courses", response_model=CourseList)
async def get_courses(current_user: dict = Depends(get_current_user)):
    """
    Get list of all courses with their IDs and names
    """
    cursor = courses_collection.find({})
    courses = []
    async for doc in cursor:
        courses.append({"course_id": str(doc["_id"]), "course_name": doc["course_name"]})
    return {"courses": courses}

@app.post("/courses", status_code=201)
async def create_course(course: CourseCreate, current_user: dict = Depends(get_current_user)):
    """
    Create a new course
    """
    course_data = course.dict()
    result = await courses_collection.insert_one(course_data)
    return {"course_id": str(result.inserted_id), "message": "Course created successfully"}

@app.get("/courses/{course_id}", response_model=LectureList)
async def get_course_lectures(course_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get list of all lectures for a specific course
    """
    try:
        course_oid = ObjectId(course_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    # Check if course exists
    course = await courses_collection.find_one({"_id": course_oid})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get lectures for this course
    cursor = lectures_collection.find({"course_id": course_id})
    lectures = []
    async for doc in cursor:
        lectures.append({
            "lecture_id": str(doc["_id"]), 
            "lecture_name": doc["lecture_name"]
        })
    
    return {"lectures": lectures}

@app.post("/courses/{course_id}")
async def create_note(
    course_id: str,
    note: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new note entry for a course with title, user_note, recording and transcript
    Returns the lecture_id of the newly created entry
    """
    try:
        course_oid = ObjectId(course_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    
    # Check if course exists
    course = await courses_collection.find_one({"_id": course_oid})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Create lecture entry with the note content
    lecture_data = {
        "lecture_name": note.title,
        "course_id": course_id,
        "materials": {
            "note": note.user_note,
            "recording": note.recording,
            "transcript": note.transcript,
            "slides": ""
        }
    }
    
    result = await lectures_collection.insert_one(lecture_data)
    return {
        "lecture_id": str(result.inserted_id)
    }

@app.post("/courses/{course_id}/{lecture_id}")
async def update_lecture_materials(
    course_id: str, 
    lecture_id: str, 
    materials: LectureMaterial,
    current_user: dict = Depends(get_current_user)
):
    """
    Update lecture materials (notes, slides, recording, transcript)
    """
    try:
        lecture_oid = ObjectId(lecture_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid lecture ID")
    
    # Check if lecture exists and belongs to the specified course
    lecture = await lectures_collection.find_one({
        "_id": lecture_oid,
        "course_id": course_id
    })
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found or doesn't belong to specified course")
    
    # Update the materials
    update_result = await lectures_collection.update_one(
        {"_id": lecture_oid},
        {"$set": {"materials": materials.dict()}}
    )
    
    if update_result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update lecture materials")
    
    return {"message": "Lecture materials updated successfully"}

@app.get("/courses/{course_id}/{lecture_id}", response_model=LectureMaterial)
async def get_lecture_materials(
    course_id: str, 
    lecture_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get lecture materials (notes, slides, recording, transcript)
    """
    try:
        lecture_oid = ObjectId(lecture_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid lecture ID")
    
    # Check if lecture exists and belongs to the specified course
    lecture = await lectures_collection.find_one({
        "_id": lecture_oid,
        "course_id": course_id
    })
    
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found or doesn't belong to specified course")
    
    # Return the materials
    materials = lecture.get("materials", {})
    return LectureMaterial(
        note=materials.get("note", ""),
        slides=materials.get("slides", ""),
        recording=materials.get("recording", ""),
        transcript=materials.get("transcript", ""),
        ai_note=materials.get("ai_note", "")
    )

@app.post("/api/lectures/save")
async def save_lecture_files(
    audio: Optional[UploadFile] = File(None),
    slides: Optional[UploadFile] = File(None),
    title: str = Form(...),
    transcript: str = Form(...),
    timestamps: Optional[str] = Form(None),
    courseId: Optional[str] = Form(None),
    lectureId: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Save lecture files (audio recording and slides) to the server.
    Returns file paths and lecture data.
    """
    file_paths = {}
    response_data = LectureMaterial()
    
    try:
        # Save audio file if provided
        audio_path = None
        if audio:
            audio_path = await save_file(audio, AUDIO_DIR)
            file_paths["audio"] = audio_path
            # Create URL path for frontend
            audio_url = f"/uploads/audio/{os.path.basename(audio_path)}"
            response_data.recording = audio_url
        
        # Save slides file if provided
        slides_path = None
        if slides:
            slides_path = await save_file(slides, SLIDES_DIR)
            file_paths["slides"] = slides_path
            # Create URL path for frontend
            slides_url = f"/uploads/slides/{os.path.basename(slides_path)}"
            response_data.slides = slides_url
        
        # Process transcript
        response_data.transcript = transcript
        
        # Process timestamps if provided
        timestamp_data = []
        if timestamps:
            try:
                timestamp_data = json.loads(timestamps)
            except json.JSONDecodeError:
                print("Could not parse timestamps JSON")
        
        # Create or update lecture in database if course ID is provided
        if courseId:
            if lectureId:
                # Update existing lecture
                try:
                    lecture_oid = ObjectId(lectureId)
                    
                    # Check if lecture exists
                    lecture = await lectures_collection.find_one({
                        "_id": lecture_oid,
                        "course_id": courseId
                    })
                    
                    if lecture:
                        # Update the lecture materials
                        await lectures_collection.update_one(
                            {"_id": lecture_oid},
                            {"$set": {
                                "materials": {
                                    "note": lecture.get("materials", {}).get("note", ""),
                                    "recording": response_data.recording,
                                    "slides": response_data.slides,
                                    "transcript": response_data.transcript,
                                    "ai_note": lecture.get("materials", {}).get("ai_note", "")
                                }
                            }}
                        )
                except Exception as e:
                    print(f"Failed to update lecture in database: {str(e)}")
            else:
                # Create new lecture
                try:
                    lecture_data = {
                        "lecture_name": title,
                        "course_id": courseId,
                        "materials": {
                            "note": "",
                            "recording": response_data.recording,
                            "slides": response_data.slides,
                            "transcript": response_data.transcript,
                            "ai_note": ""
                        },
                        "timestamps": timestamp_data
                    }
                    
                    result = await lectures_collection.insert_one(lecture_data)
                    lectureId = str(result.inserted_id)
                except Exception as e:
                    print(f"Failed to create lecture in database: {str(e)}")
        
        # Return file paths and response data
        return {
            "filePaths": file_paths,
            "response": response_data.dict()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save lecture files: {str(e)}")

# Mount static file serving for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
