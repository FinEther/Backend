from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from jose import JWTError, jwt
from os import urandom
from web3.auto import w3
from eth_account.messages import encode_defunct
from hexbytes import HexBytes
from fastapi.middleware.cors import CORSMiddleware


from . import db_models, schemas, database, security, services

db_models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200","http://192.168.68.133:4200"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

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

@app.post("/users/register", response_model=schemas.Token)
async def create_user_route(user_create: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = services.create_user(db, user_create)
    if not db_user:
        raise HTTPException(status_code=400, detail="User creation failed")
    services.welcome_notification(db_user.id)
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

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

@app.post("/users/nonce")
def get_nonce(address: schemas.RequestNonce, db: Session = Depends(database.get_db)):
    user = services.get_user_by_adress(db, address.meta_mask_address)
    if not user:
        raise HTTPException(status_code=404, detail="MetaMask address not found")
    
    # Create a specific message format
    nonce = urandom(16).hex()
    message = f"Please sign this message to verify your identity.\nNonce: {nonce}"
    user.nonce = nonce
    db.commit()
    
    return {"message": message, "nonce": nonce}



@app.post("/metamask/verify")
def verify_signature(verify: schemas.VerifyMetamask, db: Session = Depends(database.get_db)):
    user = services.get_user_by_adress(db, verify.meta_mask_address)
    if not user:
        raise HTTPException(status_code=404, detail="MetaMask address not found")

    nonce = user.nonce
    message = f"Please sign this message to verify your identity.\nNonce: {nonce}"
    
    # Create the message hash that was signed
    encoded_message = encode_defunct(text=message)

    print("Message:", message)
    print("Encoded Message:", encoded_message)

    try:
        recovered_address = w3.eth.account.recover_message(encoded_message, signature=verify.signature)
        print("Recovered Address:", recovered_address)
        print("Expected Address:", verify.meta_mask_address)

        if recovered_address.lower() != verify.meta_mask_address.lower():
            raise HTTPException(status_code=400, detail="Signature verification failed")
    except Exception as e:
        print("Error:", str(e))
        raise HTTPException(status_code=400, detail="Error verifying signature")

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Generate new nonce for next time
    user.nonce = urandom(16).hex()
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}