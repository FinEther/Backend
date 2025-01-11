from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from .db_models import User
from .schemas import UserCreate
from .security import verify_password, get_password_hash
import requests
import os

Notification_URL=os.getenv("NOTIFICATION_URL")

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_adress(db:Session,adress:str):
    return db.query(User).filter(User.meta_mask_address == adress).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    nonce = os.urandom(16).hex()
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        meta_mask_address=user.meta_mask_address,
        nonce=nonce
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    except IntegrityError as e:
        db.rollback()
        if "username" in str(e.orig):
            raise HTTPException(status_code=400, detail="Username already exists")
        elif "email" in str(e.orig):
            raise HTTPException(status_code=400, detail="Email already exists")
        elif "meta_mask_address" in str(e.orig):
            raise HTTPException(status_code=400, detail="Meta Mask Address already exists")
        raise HTTPException(status_code=400, detail="Error creating user")

def welcome_notification(id):
    notification_data = {
        "user_id": id,
        "titre": "Welcome",
        "objet": "Welcome to our platform ",
    }
    try:
        response = requests.post(f"{Notification_URL}/send_notification", json=notification_data)
        response.raise_for_status()
        print("Notification sent successfully")
        return response.json()
    except requests.ConnectionError:
        print("Connection error: Unable to reach notification service")
    except requests.Timeout:
        print("Timeout error: Notification service is not responding")
    except requests.RequestException as e:
        print(f"Unexpected error: {e}")


def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

