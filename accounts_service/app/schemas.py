from pydantic import BaseModel

class BankAccountAdd(BaseModel):
    account_number: str

class BankAccount(BaseModel):
    id: int
    account_number: str
    user_id: int

    class Config:
        orm_mode = True

class UserToUserTransaction(BaseModel):
    receiver_username: str
    amount: float

class UserToBankTransaction(BaseModel):
    account_number: str
    amount: float