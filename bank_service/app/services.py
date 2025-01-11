from sqlalchemy.orm import Session
from .models import BankAccount
from fastapi import HTTPException

def get_account_by_number(db: Session, account_number: str):
    account = db.query(BankAccount).filter(BankAccount.account_number == account_number).first()
    return account

def get_account_by_details(db: Session, account_number: str, cvv: str, expiry_date: str):
    account = db.query(BankAccount).filter(
        BankAccount.account_number == account_number,
        BankAccount.cvv == cvv,
        BankAccount.expiry_date == expiry_date
    ).first()
    return account

def get_balance_by_account_number(db: Session, account_number: str):
    account = get_account_by_number(db, account_number)
    if not account:
        return None
    return account.balance


def money_in(db: Session, account_number: str, amount: float):
    account = get_account_by_number(db, account_number)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.balance += amount
    db.commit()
    db.refresh(account)
    return account


def money_out(db: Session, account_number: str, amount: float):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    account = get_account_by_number(db, account_number)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    account.balance -= amount
    db.commit()
    db.refresh(account)
    return account

