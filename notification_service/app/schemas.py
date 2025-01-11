from pydantic import BaseModel

class SendNotification(BaseModel):
    user_id: int
    titre:str
    objet:str

class ShowNotification(BaseModel):
    titre:str
    objet:str
    date:str