from fastapi import FastAPI, HTTPException, Form, Query, UploadFile, File
from database import banco_dados
import re
import json
import base64
import io
import os
import hashlib
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dateutil.relativedelta import relativedelta
from pydantic import BaseModel
import qrcode
from datetime import datetime, date

# uvicorn main:app --reload  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

ENUMS_PERMITIDOS = {"escola", "curso_interesse", "disciplina", "status_academico"}

@app.get("/opcoes/{nome}")
async def opcoes(nome: str):
    """Busca os valores do enum diretamente do banco de dados."""
    if nome not in ENUMS_PERMITIDOS:
        raise HTTPException(status_code=404, detail=f"Enum '{nome}' não encontrado.")
    res = banco_dados.rpc("get_enum_values", {"enum_name": nome}).execute()
    return res.data

def validar_email_backend(email: str):
    padrao = r"^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
    if not re.match(padrao, email.lower()):
        return False, "E-mail inválido."
    return True, ""

def validar_nome_sem_numeros(nome: str):
    if any(char.isdigit() for char in nome):
        return False, "O nome não pode conter números."
    if len(nome.strip()) < 3:
        return False, "Nome muito curto."
    return True, ""

def checar_admin(email: str):
    res = banco_dados.table("users").select("is_admin").eq("email", email).single().execute()
    if not res.data or not res.data.get("is_admin"):
        raise HTTPException(status_code=403, detail="Acesso negado.")

@app.get("/")
async def read_index():
    return RedirectResponse(url="/docs")

# ==================== USER ====================

@app.post("/usuarios/novo")
async def cadastro_user(nome: str, email: str, data_nasc: str, telefone: str = '', status_academico: str = '', escola: str = "", curso_interesse: str = "", disciplina: str = ""):
    v_nome, m_nome = validar_nome_sem_numeros(nome)
    if not v_nome: raise HTTPException(status_code=400, detail=m_nome)

    v_email, m_email = validar_email_backend(email)
    if not v_email: raise HTTPException(status_code=400, detail=m_email)

    data_n_dt = datetime.strptime(data_nasc, "%Y-%m-%d")
    idade = relativedelta(datetime.now(), data_n_dt).years
    if idade < 15:
        raise HTTPException(status_code=400, detail="Você precisa ter pelo menos 15 anos.")
    
    if not disciplina.strip():
        raise HTTPException(status_code=400, detail="Selecione uma disciplina.")
    
    if not escola.strip():
        raise HTTPException(status_code=400, detail="Selecione uma instituição de ensino.")
    
    if escola != "UNDB":
        if not status_academico.strip():
            raise HTTPException(status_code=400, detail="Selecione o status acadêmico.")
        if not curso_interesse.strip():
            raise HTTPException(status_code=400, detail="Selecione o curso de interesse.")

    registro = datetime.now().isoformat()
    dados_user = {
        "nome": nome.title(),
        "data_nasc": data_nasc,
        "email": email.lower().strip(),
        "telefone": telefone,
        "status_academico": status_academico or None,
        "escola": escola or None,
        "curso_interesse": curso_interesse or None,
        "pontos": 0,
        "data_registro": registro,
        "disciplina": disciplina
    }

    try:
        response = banco_dados.table("users").insert(dados_user).execute()
        return {"status": "Sucesso", "user": response.data[0]}
    except Exception as e:
        print(f"Erro detectado: {e}")
        error_msg = str(e)
        if "23505" in error_msg or "duplicate key" in error_msg:
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado em nossa base.")
        raise HTTPException(status_code=500, detail="Erro interno no servidor ao realizar cadastro.")

@app.get("/usuarios/verificar-admin")
async def verificar_admin(email: str):
    try:
        user = banco_dados.table('users').select("is_admin").eq("email", email).single().execute()
        if user.data:
            return {"is_admin": user.data.get('is_admin', False)}
        return {"is_admin": False}
    except Exception:
        return {"is_admin": False}

@app.get("/usuarios/dados/exportar")
async def exportar_dados(
    admin_email: str = Query(...),
    data: date = Query(...),
    formato: str = Query("xlsx"),
    disciplina: str = Query(None),
    pontos_min: int = Query(None),
    pontos_max: int = Query(None),
):
    checar_admin(admin_email)
    query = (
        banco_dados.table("users")
        .select("nome, pontos, disciplina, escola")
        .gte("data_registro", f"{data}T00:00:00")
        .lte("data_registro", f"{data}T23:59:59")
    )
    if disciplina:
        query = query.eq("disciplina", disciplina)
    if pontos_min is not None:
        query = query.gte("pontos", pontos_min)
    if pontos_max is not None:
        query = query.lte("pontos", pontos_max)

    response = query.execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Nenhum usuário encontrado para os filtros informados.")

    usuarios = response.data

    if formato == "json":
        relatorio = {
            "data_relatorio": str(data),
            "filtros": {"disciplina": disciplina, "pontos_min": pontos_min, "pontos_max": pontos_max},
            "total_alunos": len(usuarios),
            "alunos": usuarios
        }
        json_bytes = json.dumps(relatorio, ensure_ascii=False, indent=2).encode("utf-8")
        return StreamingResponse(io.BytesIO(json_bytes), media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=relatorio_{data}.json"})

    elif formato == "xlsx":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"Relatório {data}"
        colunas = ["Nome", "Pontos", "Disciplina", "Escola"]
        campos  = ["nome", "pontos", "disciplina", "escola"]
        header_fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        for col_idx, titulo in enumerate(colunas, start=1):
            cell = ws.cell(row=1, column=col_idx, value=titulo)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")
        for row_idx, usuario in enumerate(usuarios, start=2):
            for col_idx, campo in enumerate(campos, start=1):
                ws.cell(row=row_idx, column=col_idx, value=usuario.get(campo, ""))
        for col in ws.columns:
            max_length = max((len(str(c.value)) for c in col if c.value), default=10)
            ws.column_dimensions[col[0].column_letter].width = max_length + 4
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return StreamingResponse(buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=relatorio_{data}.xlsx"})

    raise HTTPException(status_code=400, detail="Formato inválido.")
    
@app.get("/ranking")
async def ranking(limit: int = 10):
    """
    Retorna o ranking ordenado por pontos.
    - limit=10  → top 10 para a tela de ranking/home (padrão)
    - limit=0   → todos os usuários
    """
    query = (
        banco_dados.table("users")
        .select("id_user, nome, pontos, catch(count), data_registro")
        .eq("is_admin", False)
        .order("pontos", desc=True)
        .order("data_registro", desc=False)  
    )
    if limit > 0:
        query = query.limit(limit)
 
    res = query.execute()
 
    ranking_formatado = []
    for user in res.data:
        ranking_formatado.append({
            "id": user["id_user"],
            "nome": user["nome"],
            "pontos": user["pontos"],
            "qrs_capturados": user["catch"][0]["count"] if user.get("catch") else 0
        })
    return ranking_formatado
 

@app.get("/usuarios/{id_user}/posicao")
async def posicao_usuario(id_user: str):
    """
    Retorna a posição, pontos e QRs de um usuário sem carregar o ranking inteiro.
    Conta quantos usuários não-admin têm pontos maiores que o alvo.
    """
    usuario = (
        banco_dados.table("users")
        .select("id_user, nome, pontos, data_registro")
        .eq("id_user", id_user)
        .single()
        .execute()
    )
    if not usuario.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
 
    pontos = usuario.data["pontos"]
    acima_por_pontos = (
        banco_dados.table("users")
        .select("id_user", count="exact")
        .eq("is_admin", False)
        .gt("pontos", pontos)
        .execute()
    )
 
    acima_por_registro = (
        banco_dados.table("users")
        .select("id_user", count="exact")
        .eq("is_admin", False)
        .eq("pontos", pontos)
        .lt("data_registro", usuario.data["data_registro"])
        .execute()
    )
 
    posicao = (acima_por_pontos.count or 0) + (acima_por_registro.count or 0) + 1
 
    qrs = (
        banco_dados.table("catch")
        .select("id_catch", count="exact")
        .eq("id_user", id_user)
        .execute()
    )
 
    return {
        "id": id_user,
        "nome": usuario.data["nome"],
        "pontos": pontos,
        "posicao": posicao,
        "qrs_capturados": qrs.count or 0
    }

@app.post("/login")
async def login(email: str = Form(...), data_nasc: str = Form(...)):
    try:
        res = banco_dados.table("users")\
            .select("id_user, nome, email, pontos, is_admin")\
            .eq("email", email)\
            .eq("data_nasc", data_nasc)\
            .execute()
        
        if len(res.data) > 0:
            return {"user": res.data[0]}
        else:
            raise HTTPException(status_code=401, detail="E-mail ou data incorretos")

    except HTTPException:
        raise    
    
    except Exception as e:
        raise HTTPException(status_code=400, detail="Formato de data inválido. Use AAAA-MM-DD")

@app.post("/responder")
async def responder_pergunta(
    user_id: str = Form(...),
    id_pergunta: str = Form(...),
    resposta: str = Form(...),
    tempo_segundos: int = Form(...),
):
    pergunta = banco_dados.table("perguntas").select("*").eq("id_pergunta", id_pergunta).single().execute()
    if not pergunta.data:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada.")

    qrs_com_pergunta = (
        banco_dados.table("qrcodes")
        .select("code_hash")
        .eq("id_pergunta", id_pergunta)
        .execute()
    )
    hashes_validos = [q["code_hash"] for q in (qrs_com_pergunta.data or [])]

    if not hashes_validos:
        raise HTTPException(status_code=400, detail="Nenhum QR Code vinculado a esta pergunta.")

    captura_valida = (
        banco_dados.table("catch")
        .select("id_catch")
        .eq("id_user", user_id)
        .in_("code_hash", hashes_validos)
        .execute()
    )
    if not captura_valida.data:
        raise HTTPException(status_code=403, detail="Capture o QR Code antes de responder.")

    ja_respondeu = (
        banco_dados.table("user_perguntas")
        .select("id")
        .eq("id_user", user_id)
        .eq("id_pergunta", id_pergunta)
        .execute()
    )
    if ja_respondeu.data:
        raise HTTPException(status_code=400, detail="Você já respondeu esta pergunta.")

    p = pergunta.data
    acertou = resposta.upper() == p["resposta_correta"].upper()
    pontos_bonus = (p["pontos_rapido"] if tempo_segundos <= 10 else p["pontos_lento"]) if acertou else 0

    try:
        # Sempre registra, independente de acerto — o trigger cuida dos pontos
        banco_dados.table("user_perguntas").insert({
            "id_user": user_id,
            "id_pergunta": id_pergunta,
            "resposta": resposta,
            "tempo_segundos": tempo_segundos,
        }).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao registrar resposta. Tente novamente.")

    return {
        "acertou": acertou,
        "resposta_correta": p["resposta_correta"],
        "pontos_bonus": pontos_bonus,
        "feedback": "Resposta correta! 🎉" if acertou else "Resposta errada. Sem pontos bônus desta vez.",
    }

@app.get("/usuarios/{id_user}/medalhas")
async def medalhas_do_usuario(id_user: str):
    response = (
        banco_dados.table("user_medalhas")
        .select("id_medalha, conquistado_em, medalhas(id_medalha, nome, descricao, imagem_base64)")
        .eq("id_user", id_user)
        .order("conquistado_em", desc=True)
        .execute()
    )
    if not response.data:
        return []
    resultado = []
    for row in response.data:
        medalha = row.get("medalhas")
        if medalha:
            resultado.append({
                "id_medalha": medalha["id_medalha"],
                "nome": medalha["nome"],
                "descricao": medalha.get("descricao", ""),
                "imagem_base64": medalha.get("imagem_base64", ""),
                "conquistado_em": row["conquistado_em"],
            })
    return resultado

@app.patch("/usuarios/{id_user}/nome")
async def atualizar_nome(id_user: str, nome: str = Query(...)):
    v_nome, m_nome = validar_nome_sem_numeros(nome)
    if not v_nome:
        raise HTTPException(status_code=400, detail=m_nome)
    
    resultado = banco_dados.table("users").update({"nome": nome.title()}).eq("id_user", id_user).execute()
    if not resultado.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"status": "Sucesso", "nome": resultado.data[0]["nome"]}

# ==================== QRCODE ====================

@app.get("/qrcodes/gerar")
async def gerar_qr(
    nome_local: str,
    pontos: int,
    admin_email: str,
    id_medalha: str = Query(None),
    id_pergunta: str = Query(None),
    
):
    checar_admin(admin_email)
    dados_hash = f"{nome_local}-{pontos}{os.urandom(4).hex()}"
    code_hash = hashlib.sha256(dados_hash.encode()).hexdigest()[:12]

    insert_data = {
        "code_hash": code_hash,
        "pontos": pontos,
        "local": nome_local,
    }
    if id_medalha:
        insert_data["id_medalha"] = id_medalha
    if id_pergunta:
        insert_data["id_pergunta"] = id_pergunta

    banco_dados.table('qrcodes').insert(insert_data).execute()

    return {"status": "Sucesso", "code_hash": code_hash}


@app.get("/qrcodes/download/{code_hash}")
async def download_qr(code_hash: str):
    response = banco_dados.table("qrcodes").select("local").eq("code_hash", code_hash).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="QR Code não encontrado")

    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f"https://qr-code-hunt.vercel.app/scan/{code_hash}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

@app.get("/qrcodes/listar")
async def listar_qrcodes(admin_email: str):
    checar_admin(admin_email)
    response = banco_dados.table('qrcodes').select("*").execute()
    return response.data

class StatusUpdate(BaseModel):
    ativo: bool

@app.patch("/qrcodes/status/{code_hash}")
async def toggle_status_qr(code_hash: str, body: StatusUpdate, admin_email: str):
    checar_admin(admin_email)
    resultado = banco_dados.table('qrcodes').update({"ativo": body.ativo}).eq("code_hash", code_hash).execute()
    if not resultado.data:
        raise HTTPException(status_code=404, detail="QR Code não encontrado")
    return {"status": "sucesso", "ativo": body.ativo}

@app.patch("/qrcodes/{code_hash}/vincular")
async def vincular_qrcode(
    code_hash: str,
    admin_email: str,
    id_medalha: str = Query(None),
    id_pergunta: str = Query(None),
):
    checar_admin(admin_email)
    atualizacao = {}
    if id_medalha is not None:
        atualizacao["id_medalha"] = None if id_medalha == "null" else id_medalha
    if id_pergunta is not None:
        atualizacao["id_pergunta"] = None if id_pergunta == "null" else id_pergunta

    if not atualizacao:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")

    resultado = banco_dados.table("qrcodes").update(atualizacao).eq("code_hash", code_hash).execute()
    if not resultado.data:
        raise HTTPException(status_code=404, detail="QR Code não encontrado.")
    return {"status": "Sucesso", "qrcode": resultado.data[0]}


@app.post("/capturar")
async def capturar(user_id: str = Form(...), code_hash: str = Form(...)):
    
    try:

        qr_data = (
        banco_dados.table("qrcodes")
        .select("pontos, ativo, id_medalha, id_pergunta")
        .eq("code_hash", code_hash)
        .single()
        .execute()
        )
        if not qr_data.data:
            return {"status": "Erro", "msg": "QR Code não encontrado."}
        if not qr_data.data["ativo"]:
            return {"status": "Erro", "msg": "Este QR Code foi desativado e não pode mais ser escaneado."}
        # 1 Verifica se o QRcode existe ou se esta ativo


        ja_capturado = (
            banco_dados.table("catch")
            .select("id_catch")
            .eq("id_user", user_id)
            .eq("code_hash", code_hash)
            .execute()
        )
        # 2 verifica se ja foi capturado
        if ja_capturado.data:
            return {"status": "Erro", "msg": "Você já capturou este QR Code!"}

        valor_pontos = qr_data.data["pontos"]
        id_medalha   = qr_data.data["id_medalha"]
        id_pergunta  = qr_data.data["id_pergunta"]


        # 3. Registra a captura do QR
        banco_dados.table("catch").insert({
            "id_user": user_id,
            "catch_time": datetime.now().isoformat(),
            "code_hash": code_hash
        }).execute()

        # 5. Tenta conceder a medalha — mas só se o usuário ainda não a tiver
        medalha_conquistada = False
        if id_medalha:
            ja_tem_medalha = (
                banco_dados.table("user_medalhas")
                .select("id")
                .eq("id_user", user_id)
                .eq("id_medalha", id_medalha)
                .execute()
            )
            if not ja_tem_medalha.data:
                banco_dados.table("user_medalhas").insert({
                    "id_user": user_id,
                    "id_medalha": id_medalha,
                    "conquistado_em": datetime.now().isoformat()
                }).execute()
                medalha_conquistada = True
            # Se já tinha a medalha, simplesmente ignora — o QR já foi capturado com sucesso acima

        # 6. Busca a pergunta vinculada, se houver
        pergunta = None
        if id_pergunta:
            p = banco_dados.table("perguntas").select("*").eq("id_pergunta", id_pergunta).single().execute()
            if p.data:
                pergunta = {
                    "id_pergunta": p.data["id_pergunta"],
                    "enunciado": p.data["enunciado"],
                    "tipo": p.data["tipo"],
                    "alternativas": p.data["alternativas"],
                }

        return {
            "status": "Sucesso",
            "pontos_qr": valor_pontos,
            "pergunta": pergunta,
            "medalha_conquistada": medalha_conquistada  # True só se a medalha foi de fato concedida agora
        }

    except Exception as e:
        print(f"Erro inesperado na captura: {e}")
        return {"status": "Erro", "msg": "Erro interno ao processar a captura. Tente novamente."}

# ==================== MEDALHAS ====================

@app.post("/medalhas/nova")
async def criar_medalha(
    admin_email: str = Query(...),
    nome: str = Form(...),
    descricao: str = Form(""),
    imagem: UploadFile = File(...)
):
    checar_admin(admin_email)
    conteudo = await imagem.read()
    base64_img = base64.b64encode(conteudo).decode("utf-8")
    mime = imagem.content_type
    imagem_base64 = f"data:{mime};base64,{base64_img}"

    resultado = banco_dados.table("medalhas").insert({
        "nome": nome,
        "descricao": descricao,
        "imagem_base64": imagem_base64
    }).execute()

    return {"status": "Sucesso", "medalha": resultado.data[0]}

@app.get("/medalhas/listar")
async def listar_medalhas(admin_email: str):
    checar_admin(admin_email)
    response = banco_dados.table("medalhas").select("*").order("criado_em", desc=True).execute()
    return response.data or []

@app.patch("/medalhas/{id_medalha}")
async def editar_medalha(
    id_medalha: str,
    admin_email: str = Query(...),
    nome: str = Form(None),
    descricao: str = Form(None),
    imagem: UploadFile = File(None),
):
    checar_admin(admin_email)
    atualizacao = {}
    if nome is not None:
        atualizacao["nome"] = nome
    if descricao is not None:
        atualizacao["descricao"] = descricao
    if imagem and imagem.filename:
        conteudo = await imagem.read()
        base64_img = base64.b64encode(conteudo).decode("utf-8")
        mime = imagem.content_type
        atualizacao["imagem_base64"] = f"data:{mime};base64,{base64_img}"

    if not atualizacao:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")

    resultado = banco_dados.table("medalhas").update(atualizacao).eq("id_medalha", id_medalha).execute()
    if not resultado.data:
        raise HTTPException(status_code=404, detail="Medalha não encontrada.")
    return {"status": "Sucesso", "medalha": resultado.data[0]}

@app.delete("/medalhas/{id_medalha}")
async def deletar_medalha(id_medalha: str,admin_email: str):
    checar_admin(admin_email)
    banco_dados.table("qrcodes").update({"id_medalha": None}).eq("id_medalha", id_medalha).execute()
    banco_dados.table("medalhas").delete().eq("id_medalha", id_medalha).execute()
    return {"status": "Sucesso", "mensagem": "Medalha removida."}

# ==================== PERGUNTAS ====================

@app.post("/perguntas/nova")
async def criar_pergunta(
    admin_email: str = Query(...),
    enunciado: str = Form(...),
    tipo: str = Form(...),
    resposta_correta: str = Form(...),
    pontos_rapido: int = Form(50),
    pontos_lento: int = Form(20),
    alternativa_a: str = Form(""),
    alternativa_b: str = Form(""),
    alternativa_c: str = Form(""),
    alternativa_d: str = Form(""),
):
    checar_admin(admin_email)
    if tipo not in ("multipla_escolha", "verdadeiro_falso"):
        raise HTTPException(status_code=400, detail="Tipo inválido.")

    if tipo == "multipla_escolha":
        if not all([alternativa_a, alternativa_b, alternativa_c, alternativa_d]):
            raise HTTPException(status_code=400, detail="Preencha todas as alternativas A, B, C e D.")
        if resposta_correta not in ("A", "B", "C", "D"):
            raise HTTPException(status_code=400, detail="Resposta correta deve ser A, B, C ou D.")
        alternativas = {"A": alternativa_a, "B": alternativa_b, "C": alternativa_c, "D": alternativa_d}
    else:
        if resposta_correta not in ("V", "F"):
            raise HTTPException(status_code=400, detail="Resposta correta deve ser V ou F.")
        alternativas = {"V": "Verdadeiro", "F": "Falso"}

    resultado = banco_dados.table("perguntas").insert({
        "enunciado": enunciado,
        "tipo": tipo,
        "alternativas": alternativas,
        "resposta_correta": resposta_correta,
        "pontos_rapido": pontos_rapido,
        "pontos_lento": pontos_lento,
    }).execute()

    return {"status": "Sucesso", "pergunta": resultado.data[0]}

@app.get("/perguntas/listar")
async def listar_perguntas(admin_email: str):
    checar_admin(admin_email)
    response = banco_dados.table("perguntas").select("*").order("criado_em", desc=True).execute()
    return response.data or []

@app.patch("/perguntas/{id_pergunta}")
async def editar_pergunta(
    id_pergunta: str,
    admin_email: str = Query(...),
    enunciado: str = Form(None),
    tipo: str = Form(None),
    resposta_correta: str = Form(None),
    pontos_rapido: int = Form(None),
    pontos_lento: int = Form(None),
    alternativa_a: str = Form(None),
    alternativa_b: str = Form(None),
    alternativa_c: str = Form(None),
    alternativa_d: str = Form(None),
):
    checar_admin(admin_email)
    atualizacao = {}
    if enunciado is not None:
        atualizacao["enunciado"] = enunciado
    if tipo is not None:
        atualizacao["tipo"] = tipo
    if resposta_correta is not None:
        atualizacao["resposta_correta"] = resposta_correta
    if pontos_rapido is not None:
        atualizacao["pontos_rapido"] = pontos_rapido
    if pontos_lento is not None:
        atualizacao["pontos_lento"] = pontos_lento

    # Determina o tipo final (pode ter mudado nesta requisição ou já existia)
    tipo_final = tipo
    if tipo_final is None:
        current = banco_dados.table("perguntas").select("tipo, alternativas").eq("id_pergunta", id_pergunta).single().execute()
        tipo_final = current.data.get("tipo") if current.data else None

    if tipo_final == "verdadeiro_falso":
        # Sempre sobrescreve com apenas V/F, descartando qualquer A/B/C/D anterior
        atualizacao["alternativas"] = {"V": "Verdadeiro", "F": "Falso"}
    elif tipo_final == "multipla_escolha":
        if any(x is not None for x in [alternativa_a, alternativa_b, alternativa_c, alternativa_d]):
            # Busca alternativas atuais SÓ se o tipo não mudou (para preservar as que não foram enviadas)
            if tipo is None:  # tipo não mudou, faz merge
                current = banco_dados.table("perguntas").select("alternativas").eq("id_pergunta", id_pergunta).single().execute()
                alts = current.data.get("alternativas", {}) if current.data else {}
                # Limpa chaves de verdadeiro_falso que possam ter ficado
                alts = {k: v for k, v in alts.items() if k in ("A", "B", "C", "D")}
            else:  # tipo mudou para multipla_escolha, começa do zero
                alts = {}
            if alternativa_a is not None: alts["A"] = alternativa_a
            if alternativa_b is not None: alts["B"] = alternativa_b
            if alternativa_c is not None: alts["C"] = alternativa_c
            if alternativa_d is not None: alts["D"] = alternativa_d
            atualizacao["alternativas"] = alts

    if not atualizacao:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")

    resultado = banco_dados.table("perguntas").update(atualizacao).eq("id_pergunta", id_pergunta).execute()
    if not resultado.data:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada.")
    return {"status": "Sucesso", "pergunta": resultado.data[0]}

@app.delete("/perguntas/{id_pergunta}")
async def deletar_pergunta(id_pergunta: str, admin_email: str):
    checar_admin(admin_email)
    banco_dados.table("qrcodes").update({"id_pergunta": None}).eq("id_pergunta", id_pergunta).execute()
    banco_dados.table("perguntas").delete().eq("id_pergunta", id_pergunta).execute()
    return {"status": "Sucesso", "mensagem": "Pergunta removida."}