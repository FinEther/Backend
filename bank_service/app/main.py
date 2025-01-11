from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from . import models, services, bank_database
from urllib.parse import unquote

app = FastAPI()

models.Base.metadata.create_all(bind=bank_database.engine)

@app.get("/accounts/{account_number}/balance")
def get_account_balance(account_number: str, db: Session = Depends(bank_database.get_db)):
    balance = services.get_balance_by_account_number(db, account_number)

    if balance is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"account_number": account_number, "balance": balance}

@app.get("/accounts/{account_number}")
def get_bank_account(account_number: str, db: Session = Depends(bank_database.get_db)):
    account = services.get_account_by_number(db, account_number)
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return account

@app.get("/bank_accounts/{account_number}/{cvv}/-/{expiry_date:path}")
def get_bank_account(account_number: str, cvv: str, expiry_date: str, db:Session=Depends(bank_database.get_db)):
    account=services.get_account_by_details(db,account_number,cvv,expiry_date)
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return account

@app.post("/accounts/")
def create_account(account_number: str, initial_balance: float = 0.0, db: Session = Depends(bank_database.get_db)):
    existing_account = services.get_account_by_number(db, account_number)
    if existing_account:
        raise HTTPException(status_code=400, detail="Account already exists")
    
    new_account = models.BankAccount(account_number=account_number, balance=initial_balance)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return {"message": "Account created", "account_number": new_account.account_number,"CVV":new_account.cvv,"Expiry Date":new_account.expiry_date}

@app.put("/accounts/{account_number}/deposit/{amount}")
def deposit(account_number: str, amount: float, db: Session = Depends(bank_database.get_db)):
    account = services.money_in(db, account_number, amount)
    return {"message": "Deposit successful", "account_number": account.account_number, "balance": account.balance}

@app.put("/accounts/{account_number}/withdraw/{amount}")
def withdraw(account_number: str, amount: float, db: Session = Depends(bank_database.get_db)):
    account = services.money_out(db, account_number, amount)
    return {"message": "Withdrawal successful", "account_number": account.account_number, "balance": account.balance}