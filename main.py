from fastapi import FastAPI, HTTPException
from database import banco_dados
import uuid
import os
import hashlib
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import qrcode
from datetime import datetime

# uvicorn main:app --reload  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"], # Em produção, coloque o link do seu site aqui
    allow_methods=["*"],
    allow_headers=["*"],
)

qr_folder = "generated_qrcode"
os.makedirs(qr_folder, exist_ok=True)

@app.get("/")
def home():
    return{"Status": "Backend QRCode Hunt ativo"}

@app.post("/usuarios/novo")
async def cadastro_user(nome: str, email: str, data_nasc: str, telefone: str = '', status_a: str = '', escola: str = "", curso_interesse: str = ""):

    u_user = str(uuid.uuid4())
    registro = datetime.now().isoformat()
    data, count = banco_dados.table('users').insert({
        "id_user": u_user,
        "nome": nome,
        "data_nasc": data_nasc,
        "email": email,
        "telefone": telefone,
        "status_academico": status_a,
        "escola": escola,
        "curso_interesse": curso_interesse,
        "pontos": 0,
        "data_registro": registro
    }).execute()

    if not data:
        raise HTTPException(status_code=400, detail="Erro no cadastro")
    return {"mensagem": "Usuario cadastrado", "user": data[1][0]}

@app.get("/qrcodes/gerar")
async def gerar_qr(nome_local: str, pontos: int):
    dados_hash = f"{nome_local}-{pontos}{os.urandom(4).hex()}"
    code_hash = hashlib.sha256(dados_hash.encode()).hexdigest()[:12]

    data, _ = banco_dados.table('qrcodes').insert({
        "code_hash": code_hash,
        "pontos": pontos,
        "local": nome_local
    }).execute()

    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(code_hash)
    qr.make(fit=True)

    img = qr.make_image(fill_color ="black", back_color="white")
    filename = f'{code_hash}.png'
    filepath= os.path.join(qr_folder, filename)
    img.save(filepath)

    return FileResponse(path= filepath, filename=f"QR_{nome_local}.png", media_type="image/png")

@app.post("/capturar")
async def capturar(user_id: str, code_hash: str):
    
    u_catch = str(uuid.uuid4())
    time = datetime.now().isoformat()

    try:
        res = banco_dados.table("catch").insert({
            "id_catch": u_catch,
            "id_user": user_id,
            "catch_time": time,
            "code_hash": code_hash
        }).execute()

        return {"status": "Sucesso"}
    
    except Exception as e:
        return {"status": "Erro", "msg": str(e)}
    
@app.get("/ranking")
async def ranking():
    res = banco_dados.table("users").select("nome", "pontos").order("pontos", desc=True).limit(10).execute()
    return res.data

@app.get("/login")
async def login(email: str, data_nasc: str):
    try:
        res = banco_dados.table("users")\
            .select("*")\
            .eq("email", email)\
            .eq("data_nasc", data_nasc)\
            .execute()
        
        if len(res.data) > 0:
            return {"user": res.data[0]}
        else:
            raise HTTPException(status_code=401, detail="E-mail ou data incorretos")
            
    except Exception as e:
        # Se o usuário digitar "123" e o banco esperar uma data, 
        # ele vai cair aqui em vez de derrubar o servidor.
        raise HTTPException(status_code=400, detail="Formato de data inválido. Use AAAA-MM-DD")