from sqlalchemy.orm import Session

from .models import Notification


def add_notification(db:Session,user_id:int,titre:str,objet:str):
    notification = Notification(user_id=user_id,titre=titre,objet=objet)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def get_notification_userid(db:Session,user_id:int):
    return db.query(Notification).filter(Notification.user_id==user_id).all()