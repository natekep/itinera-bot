Overview

Itinera is a React (Vite) + FastAPI application.

Backend (FastAPI): serves APIs for itineraries/travel logic

Frontend (React + Vite): web UI for interacting with the backend

Getting Started

1. Clone the Repo

```bash
bash git clone https://github.com/your-org/itinera-bot.git
cd itinera-bot
```

2. Backend Setup (FastAPI)

Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate # (Mac/Linux)
.\venv\Scripts\activate # (Windows)
```

Install Dependencies

```bash
pip install -r requirements.txt
```

Run Backend

```bash
uvicorn main:app --reload --port 8000
```

API available at http://127.0.0.1:8000
Docs available at http://127.0.0.1:8000/docs

3. Frontend Setup (React + Vite)

Install Dependencies

```bash
cd frontend
npm install
```

Run Frontend

```bash
npm run dev
```

Frontend runs at: http://localhost:5173

4. Running Both Together

1. Start the backend:

```bash
   cd backend
   uvicorn main:app --reload --port 8000
```

1. Start the frontend:

```bash
   cd frontend
   npm run dev
```

1. Open the app in the browser at: http://localhost:5173
