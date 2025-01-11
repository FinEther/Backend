from fastapi import FastAPI, HTTPException, Request
import httpx
import os
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200","http://192.168.68.133:4200"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)





USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")
ACCOUNTS_SERVICE_URL= os.getenv("ACCOUNTS_SERVICE_URL")






@app.post("/user/SignIn")
async def login_for_access_token(request: Request):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{USER_SERVICE_URL}/token", data=await request.form())
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"User service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()



@app.get("/users/me/")
async def read_users_me(request: Request):
    headers = {"Authorization": request.headers.get("Authorization")}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{USER_SERVICE_URL}/users/me/", headers=headers)
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Users service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    
    return response.json()




@app.post("/users/nonce")
async def forward_get_nonce(request: Request):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/users/nonce", 
                json=await request.json()
            )
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Auth Service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()






@app.post("/metamask/verify")
async def forward_verify_signature(request: Request):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{USER_SERVICE_URL}/metamask/verify", 
                json=await request.json()
            )
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Auth Service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()




@app.post("/user/SignUp")
async def create_user_route(request: Request):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{USER_SERVICE_URL}/users/register", json=await request.json())
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"User service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()





@app.get("/user/account")
async def get_user_account(request: Request):
    headers = {"Authorization": request.headers.get("Authorization")}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ACCOUNTS_SERVICE_URL}/my-bank-accounts", headers=headers)
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Accounts service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()




@app.get("/notifications")
async def get_notifications(request: Request):

    headers = {"Authorization": request.headers.get("Authorization")}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ACCOUNTS_SERVICE_URL}/get_notificcations", headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Notification service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())




@app.post("/user/add_account")
async def add_my_bank_account(request:Request):
    headers = {"Authorization": request.headers.get("Authorization")}
    '''
    Exemple de Json entree:
    {
        "account_number": "987654321",
        "cvv": "416",
        "expiry_date": "01/30"
    }'''
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{ACCOUNTS_SERVICE_URL}/add_bank_account/", json=await request.json(),headers=headers)
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Accounts service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()






@app.post("/transaction/simple")
async def simple_transaction(request: Request):
    headers = {"Authorization": request.headers.get("Authorization")}
    '''
    Exemple d'entree Json:
    {
    "account_number": "1234569",
    "amount": 1000
    }'''
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{ACCOUNTS_SERVICE_URL}/transactions/simple/", json=await request.json(),headers=headers)
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Accounts service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()





@app.get("/transactions/history")
async def get_transaction_history(request: Request):
    headers = {"Authorization": request.headers.get("Authorization")}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ACCOUNTS_SERVICE_URL}/transactions/history/", headers=headers)
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Transactions service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()





@app.get("/transactions/graph_data")
async def get_transaction_graph_data(request: Request):
    headers = {"Authorization": request.headers.get("Authorization")}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ACCOUNTS_SERVICE_URL}/transactions/graph_data", headers=headers)
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Transactions service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=response.status_code, detail=response.json())
    return response.json()
