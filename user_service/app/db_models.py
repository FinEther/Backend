from sqlalchemy import Boolean, Column, Integer, String
from .database import engine,Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username=Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)
    meta_mask_address = Column(String, unique=True, nullable=False)
    nonce = Column(String, nullable=False)

User.metadata.create_all(bind=engine)