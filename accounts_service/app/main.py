from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from . import database, models, schemas, services
from typing import List

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://127.0.0.1:8000/token")
models.Base.metadata.create_all(bind=database.engine)

@app.post("/add_bank_account/", response_model=schemas.BankAccount)
def add_bank_account(
    account: schemas.BankAccountAdd,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):

    user_id = services.verify_user(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    new_account = services.add_bank_account(db, account, user_id)
    return new_account

@app.get("/bank-accounts/", response_model=List[schemas.BankAccount])
def get_all_bank_accounts(db: Session = Depends(database.get_db)):
    accounts = services.get_all_bank_accounts(db)
    if not accounts:
        raise HTTPException(status_code=404, detail="No bank accounts found")
    return accounts

@app.get("/bank-accounts/{user_id}", response_model=List[schemas.BankAccount])
def get_bank_accounts_by_user(user_id: int, db: Session = Depends(database.get_db)):
    accounts = services.get_bank_accounts_by_user(db, user_id)
    if not accounts:
        raise HTTPException(status_code=404, detail="No bank accounts found for this user")
    return accounts

@app.get("/my-bank-accounts", response_model=schemas.BankAccount)
def get_my_bank_accounts(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    user_id = services.verify_user(token)
    accounts = services.get_bank_accounts_by_user(db, user_id) 
    if not accounts:
        raise HTTPException(status_code=404, detail="No bank accounts found for this user")
    return accounts


@app.post("/transactions/user-to-user/")
def user_to_user_transaction(
    uutransaction:schemas.UserToUserTransaction,
    db: Session = Depends(database.get_db),
    token :str=Depends(oauth2_scheme)
):
    sender_id=services.verify_user(token)
    sender_account=services.get_bank_accounts_by_user(db,sender_id)
    sender=sender_account
    receiver_id=services.get_id_by_username(uutransaction.receiver_username)
    receiver=db.query(models.BankAccount).filter_by(user_id=receiver_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender account not found")
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver account not found")
    try:
        transaction = services.create_user_to_user_transaction(db, sender, receiver, uutransaction.amount)
        return {
            "message": "User-to-user transaction successful",
            "transaction": {
                "id": transaction.id,
                "sender_id": transaction.sender_id,
                "receiver_id": transaction.receiver_id,
                "amount": transaction.amount,
                "transaction_type": transaction.transaction_type.value,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/transactions/user-to-bank/")
def user_to_user_transaction(
    ubtransaction:schemas.UserToBankTransaction,
    db: Session = Depends(database.get_db),
    token :str=Depends(oauth2_scheme)
):
    sender_id=services.verify_user(token)
    sender_account=services.get_bank_accounts_by_user(db,sender_id)
    sender=sender_account[0]
    receiver=ubtransaction.account_number
    if not sender:
        raise HTTPException(status_code=404, detail="Sender account not found")
    if not receiver:
        raise HTTPException(status_code=404, detail="Bank account not found")
    try:
        transaction=services.create_user_to_bank_transaction(db,sender,receiver,ubtransaction.amount)
        return{
            "message": "User-to-Bank transaction successful",
            "transaction": {
                "id": transaction.id,
                "sender_id": transaction.sender_id,
                "receiver": transaction.receiver_account_number,
                "amount": transaction.amount,
                "transaction_type": transaction.transaction_type.value,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))