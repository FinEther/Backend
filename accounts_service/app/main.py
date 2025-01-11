from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from . import database, models, schemas, services
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200","http://192.168.68.133:4200"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://user_service:8001/token")
models.Base.metadata.create_all(bind=database.engine)

@app.post("/add_bank_account/", response_model=schemas.BankAccount,status_code=status.HTTP_201_CREATED)
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

@app.get("/bank-accounts/{user_id}", response_model=schemas.BankAccount)
def get_bank_accounts_by_user(user_id: int, db: Session = Depends(database.get_db)):
    accounts = services.get_bank_accounts_by_user(db, user_id)
    if not accounts:
        raise HTTPException(status_code=404, detail="No bank accounts found for this user")
    return accounts

@app.get("/my-bank-accounts", response_model=schemas.MyBankAccount)
def get_my_bank_accounts(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    user_id = services.verify_user(token)
    accounts = services.get_bank_accounts_by_user(db, user_id) 
    if not accounts:
        raise HTTPException(status_code=404, detail="No bank accounts found for this user")
    return accounts

@app.get("/transactions/history/")
def get_transaction_history(
    db: Session = Depends(database.get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        user_id = services.verify_user(token)
        transactions = services.get_user_transactions(user_id, db)      
        if not transactions:
            return []         
        return transactions
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/transactions/graph_data")
def get_transaction_graph_data(
    db: Session = Depends(database.get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        user_id = services.verify_user(token)
        transactions = services.get_user_transactions_summary(user_id, db)
        if not transactions:
            return []         
        return transactions
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transactions/simple/")
def simple_transaction(
    ubtransaction:schemas.UserToBankTransaction,
    db: Session = Depends(database.get_db),
    token :str=Depends(oauth2_scheme)
):
    sender_id=services.verify_user(token)
    sender=services.get_bank_accounts_by_user(db,sender_id)
    receiver=ubtransaction.account_number
    if not sender:
        raise HTTPException(status_code=404, detail="no bank account associeted to the user")
    if not receiver:
        raise HTTPException(status_code=404, detail="Bank account not found")
    try:
        transaction=services.transaction_simple(db,sender,receiver,ubtransaction.amount,ubtransaction.date)
        if transaction.transaction_type.value=="user_to_user":
            services.send_notification(
                services.get_user_id_by_account_id(db,transaction.sender_id),
                "Successfull transaction",
                f"Your transaction to {transaction.receiver_account_number} was sent successfuly"
            )
            services.send_notification(
                services.get_user_id_by_account_id(db,transaction.receiver_id),
                "Received transaction",
                f"You received {transaction.amount}$ from {transaction.receiver_account_number}"
            )
            return{
                "message": "User-to-user transaction successful",
                "transaction": {
                    "id": transaction.id,
                    "sender_id": services.get_user_id_by_account_id(db,transaction.sender_id),
                    "receiver_id": services.get_user_id_by_account_id(db,transaction.receiver_id),
                    "receiver_account": transaction.receiver_account_number,
                    "amount": transaction.amount,
                    "transaction_type": transaction.transaction_type.value,
                },
            }
        else:
            services.send_notification(
                services.get_user_id_by_account_id(db,transaction.sender_id),
                "Successfull transaction",
                f"Your transaction to {transaction.receiver_account_number} was sent successfuly"
            )
            return{
                "message": "User-to-Bank transaction successful",
                "transaction": {
                    "id": transaction.id,
                    "sender_id": services.get_user_id_by_account_id(db,transaction.sender_id),
                    "receiver": transaction.receiver_account_number,
                    "amount": transaction.amount,
                    "transaction_type": transaction.transaction_type.value,
                },
            }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



#qdima
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
#qdima
@app.post("/transactions/user-to-bank/")
def user_to_user_transaction(
    ubtransaction:schemas.UserToBankTransaction,
    db: Session = Depends(database.get_db),
    token :str=Depends(oauth2_scheme)
):
    sender_id=services.verify_user(token)
    sender_account=services.get_bank_accounts_by_user(db,sender_id)
    sender=sender_account
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
    

@app.get("/get_notificcations")
async def get_notifications(token: str = Depends(oauth2_scheme)):
    user_id=services.verify_user(token)
    notifications=services.show_notification(user_id)
    return notifications