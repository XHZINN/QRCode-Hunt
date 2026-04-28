from fastapi import FastAPI, HTTPException
from database import banco_dados
import uuid
import os
import hashlib
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import qrcode
from PIL import Image, ImageDraw, ImageOps
from datetime import datetime

# uvicorn main:app --reload  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["static/index.html"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

qr_folder = "generated_qrcode"
os.makedirs(qr_folder, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

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
    # --- SEU CÓDIGO ORIGINAL (Geração de Hash e Banco de Dados) ---
    dados_hash = f"{nome_local}-{pontos}{os.urandom(4).hex()}"
    code_hash = hashlib.sha256(dados_hash.encode()).hexdigest()[:12]

    banco_dados.table('qrcodes').insert({
        "code_hash": code_hash,
        "pontos": pontos,
        "local": nome_local
    }).execute()
    # ------------------------------------------------------------------

    # 1. Configurar QR Code com correção de erro ALTA (H) - Fundamental
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H, 
        box_size=10,
        border=4
    )
    qr.add_data(code_hash)
    qr.make(fit=True)

    # 2. Criar imagem base em RGB (fundamental para manipulação de cores)
    img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
    
    # 3. Processar o Logo
    logo_path = "imagens/logo-SH.png" # Certifique-se que o nome do arquivo está correto
    if os.path.exists(logo_path):
        # A. Abrir o logo (que é branco)
        logo = Image.open(logo_path)
        
        # B. REDIMENSIONAR (Máximo 25-30% para não quebrar a leitura)
        width, height = img.size
        # Mantive um tamanho bom para o círculo caber com folga
        logo_size = width // 3  
        logo = logo.resize((logo_size, logo_size))

        # --- NOVA LÓGICA DE CONTRASTE: Círculo Branco ---
        # A. Criar a ferramenta de desenho
        draw = ImageDraw.Draw(img)
        
        # B. Definir o diâmetro do Círculo Branco (maior que o logo para a borda)
        # padding é a borda branca que vai sobrar em volta do logo
        padding = 15 
        diametro_circulo = logo_size + (2 * padding)
        
        # C. Calcular a caixa delimitadora do círculo centralizado
        x0 = (width - diametro_circulo) // 2
        y0 = (height - diametro_circulo) // 2
        x1 = (width + diametro_circulo) // 2
        y1 = (height + diametro_circulo) // 2
        pos_fundo = (x0, y0, x1, y1)
        
        # D. Desenhar o círculo BRANCO sólido no centro
        # Isso "apaga" os módulos (pixels) que estavam lá
        draw.ellipse(pos_fundo, fill="white", outline='black', width=5)
        # ------------------------------------------------

        # --- NOVA LÓGICA DO LOGO: Inverter para Preto ---
        # A. Separar o canal Alpha (transparência) se existir
        if logo.mode == 'RGBA':
            r, g, b, a = logo.split()
            rgb_logo = Image.merge('RGB', (r, g, b))
            
            # B. Inverter as cores (Branco vira Preto)
            inverted_logo = ImageOps.invert(rgb_logo)
            
            # C. Juntar o Alpha original de volta para manter a transparência
            final_logo = Image.merge('RGBA', (inverted_logo.split()[0], inverted_logo.split()[1], inverted_logo.split()[2], a))
        else:
            # Se não tiver Alpha, a inversão é direta
            final_logo = ImageOps.invert(logo.convert('RGB'))
        # -------------------------------------------------

        # F. Centralizar e Colar o Logo AGORA PRETO
        # Ele vai ficar dentro do círculo branco
        pos_logo = ((width - logo_size) // 2, (height - logo_size) // 2)
        
        # Usa a máscara para garantir a transparência
        img.paste(final_logo, pos_logo, mask=final_logo if final_logo.mode == 'RGBA' else None)

    # 4. Salvar e Retornar
    filename = f'{code_hash}.png'
    filepath = os.path.join(qr_folder, filename)
    img.save(filepath)

    return FileResponse(path=filepath, filename=f"QR_{nome_local}.png", media_type="image/png")

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