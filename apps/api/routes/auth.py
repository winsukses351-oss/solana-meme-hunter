from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from database import get_db
from security import verify_password, create_access_token, get_password_hash
from models.schema import TokenSchema

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/token", response_model=TokenSchema)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await db.fetchrow("SELECT * FROM users WHERE username = $1", form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}
