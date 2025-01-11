from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    id:int #dkhel id:0
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    meta_mask_address: str
class UserCreate(UserBase):
    password: str



class Usertest(BaseModel):
    id:int #dkhel id:0
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    meta_mask_address: str
    nonce:str

class UserInDB(UserBase):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None

class RequestNonce(BaseModel):
    meta_mask_address: str

class VerifyMetamask(BaseModel):
    meta_mask_address: str
    signature: str