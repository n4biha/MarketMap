# MarketMap

MarketMap turns an app idea into a market brief. You type in an idea, and it
researches real sources, then returns an opportunity score, the main competitors,
user pain points, market gaps, and key risks.

## How it works

The backend runs a pipeline of four steps:

1. Scout: gathers data from web search, the App Store, Google Play, Hacker News, and Product Hunt.
2. Analyst: indexes that data and pulls out pain points, competitors, and a market summary.
3. Strategist: scores the opportunity and writes the gaps, recommended angle, and risks.
4. Formatter: assembles everything into one brief.

The frontend sends the idea to the backend, shows the pipeline running live, and
displays the finished brief. You can also export the brief as a PDF.

## Tech stack

Backend:
- Python 3.12
- FastAPI (API server)
- LangGraph (pipeline)
- Anthropic Claude (the language model)
- ChromaDB (vector search for the Analyst step)

Frontend:
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

## Prerequisites

- Python 3.12 or newer
- Node.js 20 or newer
- API keys (see Environment variables below)

## Setup

### Backend

```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a file named `.env` in the `backend` folder with your keys:

```
ANTHROPIC_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
PRODUCTHUNT_TOKEN=your_token_here
```

`ANTHROPIC_API_KEY` and `TAVILY_API_KEY` are required. `PRODUCTHUNT_TOKEN` is
optional. Without it, the Product Hunt source is skipped.

### Frontend

```
cd frontend
npm install
```

Create a file named `.env.local` in the `frontend` folder:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_MOCK=false
```

## Running

Start the backend (from the `backend` folder, with the venv active):

```
uvicorn api.main:app --port 8000
```

Start the frontend (from the `frontend` folder, in a second terminal):

```
npm run dev
```

Then open http://localhost:3000 and enter an idea.

## Running from the command line

You can also run the pipeline without the frontend:

```
cd backend
source venv/bin/activate
python run.py "your app idea"
```

This prints the brief to the terminal.

## Notes

- The pipeline needs at least 3 sources to produce a brief. Very obscure ideas may
  not return enough data.
- ChromaDB stores its index in `backend/chroma_db` by default. Set `CHROMA_PERSIST_DIR`
  to change that path.
