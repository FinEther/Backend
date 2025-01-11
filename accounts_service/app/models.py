from sqlalchemy import Column, Integer, Float, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .database import Base
from enum import Enum as PyEnum


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, nullable=False)
    expiry_date=Column(String,nullable=False)
    card_type=Column(String,nullable=False)
    currency=Column(String,nullable=False)
    user_id = Column(Integer, nullable=False)

    sent_transactions = relationship("Transaction", foreign_keys="Transaction.sender_id")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.receiver_id")


class TransactionType(PyEnum):
    USER_TO_USER = "user_to_user"
    USER_TO_BANK = "user_to_bank"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    sender_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)
    receiver_account_number = Column(String, nullable=True)
    transaction_date=Column(String,nullable=True)


    sender = relationship("BankAccount", foreign_keys=[sender_id], back_populates="sent_transactions")
    receiver = relationship("BankAccount", foreign_keys=[receiver_id], back_populates="received_transactions")