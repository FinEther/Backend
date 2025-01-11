from sqlalchemy import Column, Float, Integer, String, DateTime
from datetime import datetime
from datetime import datetime, timedelta
import random
from .bank_database import Base

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, nullable=False)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(String, default=lambda: (datetime.utcnow() + timedelta(days=5 * 365)).strftime("%m/%y"))
    cvv = Column(String, default=lambda: f"{random.randint(100, 999)}")
    currency = Column(String, default="USD")
    card_type = Column(String, default="VISA")
