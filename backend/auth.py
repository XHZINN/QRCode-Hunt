import os
import time

import jwt
from fastapi import Header, HTTPException, Depends
from passlib.hash import pbkdf2_sha256

from database import banco_dados

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_SECONDS = 60 * 60 * 24 * 30  # 30 dias


def hash_senha(senha: str) -> str:
    return pbkdf2_sha256.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return pbkdf2_sha256.verify(senha, senha_hash)


def criar_token(id_user: str) -> str:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET não configurado no .env")
    payload = {"sub": id_user, "exp": int(time.time()) + JWT_EXPIRE_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(authorization: str = Header(None)) -> str:
    """Valida o Bearer token e retorna o id_user autenticado."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente. Faça login novamente.")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")
    except jwt.PyJWTError:
        # Cobre qualquer outra falha de validação do token (assinatura, formato,
        # ou JWT_SECRET ausente/incorreto) sem vazar detalhes internos.
        raise HTTPException(status_code=401, detail="Token inválido.")

    id_user = payload.get("sub")
    if not id_user:
        raise HTTPException(status_code=401, detail="Token inválido.")
    return id_user


async def require_admin(id_user: str = Depends(get_current_user)) -> str:
    """Reconsulta is_admin fresco no banco — nunca confia em claim do token."""
    try:
        res = banco_dados.table("users").select("is_admin").eq("id_user", id_user).single().execute()
    except Exception:
        # Cobre o caso do usuário do token ter sido removido do banco.
        raise HTTPException(status_code=403, detail="Acesso negado.")
    if not res.data or not res.data.get("is_admin"):
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return id_user
