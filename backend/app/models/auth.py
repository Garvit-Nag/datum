from pydantic import BaseModel


class AuthUserType(BaseModel):
    user_id: str
    role: str = "user"
