from sqlalchemy import Boolean, Column, Integer, String
from .database import engine,Base
from datetime import datetime


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id=Column(Integer, nullable=True)
    titre = Column(String, nullable=True)
    objet = Column(String, nullable=True)
    date = Column(String, default=lambda: datetime.utcnow().strftime('%Y/%m/%d'))

Notification.metadata.create_all(bind=engine)