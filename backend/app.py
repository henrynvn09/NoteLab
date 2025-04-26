from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId


app = FastAPI()

# MongoDB connection setup
client = MongoClient('mongodb://localhost:27017/')
db = client['mydatabase']
collection = db['mycollection']

# Define a User model
class User(BaseModel):
    name: str
    email: str
    age: int

@app.get('/')
def home():
    return {"message": "Welcome to the FastAPI backend!"}

@app.post('/data')
def add_user(user: User):
    user_dict = user.dict()
    result = collection.insert_one(user_dict)
    
    # Add the inserted ID as a string, or ignore it entirely
    user_dict["_id"] = str(result.inserted_id)  # Optional
    return {"message": "User added successfully!", "data": user_dict}


@app.get('/data')
def get_users():
    users = list(collection.find({}, {"_id": 0}))
    return users
