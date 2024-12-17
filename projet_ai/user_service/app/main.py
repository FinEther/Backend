from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from jose import JWTError, jwt

from . import db_models, schemas, database, security, services

db_models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)
):
    user = services.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/register", response_model=schemas.UserCreate)
async def create_user_route(user_create: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = services.create_user(db, user_create)
    if not db_user:
        raise HTTPException(status_code=400, detail="User creation failed")
    return db_user

@app.get("/users/me/", response_model=schemas.UserBase)
async def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = services.get_user(db, username)
    if user is None:
        raise credentials_exception
    return user


@app.get("/users/id/{username}")
def get_user_id(username: str, db: Session = Depends(database.get_db)):
    user = services.get_user(db, username)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with username '{username}' not found")
    return {"username": username, "user_id": user.id}