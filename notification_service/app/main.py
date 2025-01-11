from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from . import database,models,schemas,services


models.Base.metadata.create_all(bind=database.engine)
app = FastAPI()


@app.post("/send_notification",response_model=schemas.ShowNotification)
async def send_notification(notification: schemas.SendNotification,db: Session = Depends(database.get_db)):
    new_notification=services.add_notification(db,notification.user_id,notification.titre,notification.objet)
    return new_notification


@app.get("/received_notifications/{user_id}",response_model=list[schemas.ShowNotification])
async def get_received_notifications(user_id: int,db: Session = Depends(database.get_db)):
    notifications = services.get_notification_userid(db,user_id)
    return notifications[::-1]