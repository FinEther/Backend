from pydantic import BaseModel,ConfigDict
from typing import Optional

class BankAccountAdd(BaseModel):
    account_number: str
    cvv:str
    expiry_date:str
    currency:Optional[str] = None
    card_type:Optional[str] = None

class BankAccount(BaseModel):
    id: int
    account_number: str
    user_id: int

    model_config=ConfigDict(from_attributes=True)

class UserToUserTransaction(BaseModel):
    receiver_username: str
    amount: float

class UserToBankTransaction(BaseModel):
    account_number: str
    amount: float
    date:Optional[str] = None

class MyBankAccount(BaseModel):
    account_number: str
    expiry_date:str
    card_type:str
    currency:str
    cvv: Optional[str] = None