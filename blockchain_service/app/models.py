from sqlalchemy import Column, Integer, String, Float
from .database import Base

class Wallet(Base):
    __tablename__ = "wallet"

    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String, index=True)
    user_id = Column(String, index=True)