# 🎯 Caça QR Code - WebApp

[![UNDB Badge](https://img.shields.io/badge/Software%20House-UNDB-blue)](https://github.com/sua-organizacao-undb)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-green)

Uma aplicação web interativa desenvolvida com o objetivo de **gamificar eventos** internos e externos da **Software House UNDB**. O projeto transforma a participação em palestras, workshops e dinâmicas em uma experiência lúdica e engajadora por meio do escaneamento de QR Codes.

---

## 🚀 Sobre o Projeto

O **Caça QR Code** foi criado para aumentar o engajamento do público nos eventos da UNDB. A ideia é simples e poderosa: espalhar QR Codes estratégicos pelo local do evento. Cada código escaneado valida a presença, libera conquistas ou soma pontos para o participante em um ranking em tempo real.

### 🌟 Principais Funcionalidades

* **Leitura de QR Code Integrada:** Escaneamento rápido direto pela câmera do celular, sem necessidade de instalar aplicativos adicionais.
* **Gamificação & Pontuação:** Sistema de pontuação dinâmica conforme o usuário descobre novos códigos.
* **Perguntas Bônus:** QR Codes podem liberar perguntas de múltipla escolha ou verdadeiro/falso, com pontuação extra para quem responde rápido (até 10s).
* **Medalhas/Conquistas:** QR Codes específicos podem conceder medalhas colecionáveis ao participante.
* **Leaderboard (Ranking):** Placar em tempo real para estimular a competitividade saudável entre os participantes.
* **Painel Administrativo:** Interface para a equipe da UNDB gerar QR Codes, gerenciar medalhas e perguntas, e exportar dados dos participantes (Excel/JSON).

---

## 🛠️ Tecnologias Utilizadas

Abaixo estão as principais tecnologias e bibliotecas adotadas no desenvolvimento do WebApp:

* **Front-end:** [Next.js 16](https://nextjs.org/) (React 19, App Router) + TypeScript
* **Estilização/UI:** Tailwind CSS + componentes [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
* **Leitura de QR:** [html5-qrcode](https://github.com/mebjas/html5-qrcode)
* **Back-end:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Geração de QR Code:** biblioteca `qrcode` (Python)
* **Exportação de relatórios:** `openpyxl` (Excel)

---

## 📦 Como Executar o Projeto

### Pré-requisitos
Antes de começar, você vai precisar ter instalado em sua máquina o [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/) e [Python 3.10+](https://www.python.org/), além de um projeto criado no [Supabase](https://supabase.com/).

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/caca-qrcode-undb.git
   cd caca-qrcode-undb
   ```

2. **Configurar o back-end:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate       # Windows
   # source venv/bin/activate  # Linux/Mac

   pip install -r requirements.txt
   ```

   Crie um arquivo `.env` dentro de `backend/` com as credenciais do seu projeto Supabase:
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=sua-chave-anon-ou-service-role
   ```

   Inicie o servidor:
   ```bash
   uvicorn main:app --reload
   ```
   A API ficará disponível em `http://localhost:8000` (documentação interativa em `/docs`).

3. **Configurar o front-end:**
   ```bash
   cd frontend
   npm install
   ```

   Crie um arquivo `.env.local` dentro de `frontend/` apontando para a API:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

   Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O aplicativo ficará disponível em `http://localhost:3000`.

---

## 📁 Estrutura do Projeto

```
QRCode-Hunt/
├── backend/            # API em FastAPI
│   ├── main.py         # Rotas (usuários, QR codes, medalhas, perguntas, ranking)
│   ├── database.py     # Conexão com o Supabase
│   └── requirements.txt
└── frontend/           # Aplicação Next.js
    ├── app/             # Páginas (Home, Admin)
    ├── components/      # Componentes (auth, scanner, ranking, perfil, admin)
    ├── hooks/
    └── lib/
```

---

## 🔑 Como Funciona

* **Cadastro/Login:** o participante se identifica por e-mail e data de nascimento (não há necessidade de criar senha).
* **Escaneamento:** ao escanear um QR Code pela câmera, o app envia o código capturado para a API, que valida se o código é válido, ativo e ainda não capturado por aquele usuário.
* **Pontuação:** cada captura soma pontos ao participante; QR Codes podem estar vinculados a uma medalha e/ou a uma pergunta bônus.
* **Ranking:** a posição de cada participante é calculada por pontos (e, em caso de empate, por ordem de cadastro).
* **Administração:** usuários com a flag `is_admin` têm acesso ao painel para gerar QR Codes, cadastrar medalhas/perguntas e exportar relatórios dos participantes.

---

## 📌 Status

Projeto em desenvolvimento ativo pela Software House UNDB.
