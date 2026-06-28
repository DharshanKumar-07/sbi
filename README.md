# SBI YONO Deflection Agent
 
**Intelligent, Privacy-First Branch Traffic Management**
 
The SBI YONO Deflection Agent is a full-stack, **agentic AI** solution designed to reduce physical branch congestion by autonomously routing customer queries to secure, digital self-serve workflows. Unlike keyword-based chatbots or hardcoded decision trees, this system uses a **ReAct Agent** (Reasoning + Acting loop) powered by a local LLM — giving it the ability to reason about customer intent, autonomously select the right banking tool, and orchestrate workflows without any programmed routing logic. Built specifically for high-scale banking environments, all inference runs on-premises to ensure zero customer data exposure to third-party providers.
 
---
 
## The Problem
 
SBI branches experience massive footfall for routine queries — balance checks, account statements, card blocking, KYC updates, and more. This creates significant operational overhead for branch staff and long wait times for customers, most of whom could have been served digitally.
 
---
 
## The Solution
 
A **ReAct-based Agentic Traffic Deflection Engine** that:
 
- Autonomously reasons about complex, natural-language customer queries using a ReAct loop
- Selects the correct banking tool without any hardcoded routing logic
- Deflects users to digital channels (YONO) before they ever step into a branch
---
 
## Key Features
 
- **Intent Classifier** — Maps messy, colloquial human input to strict operational categories with high accuracy
- **Policy Engine** — Automatically decides between digital self-service resolution and branch escalation based on query complexity and risk profile
- **Live Analytics Dashboard** — Real-time monitoring for branch managers to track deflection rates, query categories, and channel distribution
---
 
## Architecture
 
```
Customer Query (Natural Language)
        │
        ▼
  React.js Frontend  ──►  FastAPI Backend
                               │
                               ▼
                    LangChain Orchestration Layer
                          │              │
                          ▼              ▼
           Llama 3 via Ollama     FAISS Vector Store
           (Local Inference)    (RAG Knowledge Layer)
           HuggingFace Embeddings + sentence-transformers
                          │
                 ┌─────────┴──────────┐
                 ▼                    ▼
       Digital Self-Service     Branch Escalation
          (YONO Redirect)         (Staff Queue)
```
 
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | FastAPI (Python) |
| AI / LLM | Llama 3.1 via Ollama |
| Agent Framework | LangGraph ReAct Agent |
| RAG / Vector Store | FAISS, LangChain Community |
| Embeddings | HuggingFace, sentence-transformers |
| Language | Python 3.10+, JavaScript |
 
---
 
## Setup Instructions
 
### Prerequisites
 
- Node.js installed
- Python 3.10 or higher
- Ollama installed and running
### 1. Backend Setup
 
```bash
# Clone the repository and navigate to the project root
pip install -r requirements.txt
 
# Pull and run the Llama 3 model via Ollama
ollama run llama3.1
 
# Start the FastAPI server
uvicorn backend.main:app --reload
```
 
The backend will be available at `http://localhost:8000`.
 
### 2. Frontend Setup
 
```bash
# Navigate to the frontend directory
npm install
npm run dev
```
 
The frontend will be available at `http://localhost:5173` (or as configured by Vite).
 
---
 
## Privacy & Security
 
This solution addresses the core banking mandate of data security:
 
- **Local Inference Only** — By running Llama 3 through Ollama, all LLM processing happens on-premises. Customer data never leaves the bank's secure network.
- **Local RAG Pipeline** — Document embeddings are generated using HuggingFace sentence-transformers and stored in a FAISS index on-device. No data is sent to external embedding APIs.
- **No Third-Party API Calls** — Unlike cloud-hosted LLM solutions, there is zero dependency on external AI providers for query processing.
- **Horizontal Scalability** — The local Ollama instance can be replaced with fine-tuned models hosted in a private, load-balanced container cluster for production-scale deployments.
---
 
## Project Structure
 
```
sbi-yono-deflection-agent/
├── requirements.txt              # Python dependencies
├── README.md
├── backend/
│   ├── main.py                   # FastAPI entry point
│   ├── classifier.py             # LangChain + Ollama intent classification
│   ├── policy_engine.py          # Deflection vs escalation logic
│   └── rag/
│       ├── embeddings.py         # HuggingFace embedding pipeline
│       └── vector_store.py       # FAISS index management
├── frontend/
│   ├── src/
│   │   ├── components/           # React UI components
│   │   └── App.jsx               # Root component
│   ├── package.json
│   └── tailwind.config.js
└── data/
    └── knowledge_base/           # Source documents for RAG ingestion
```
 
---
 
## Built For
 
SBI Innovation Hackathon — submitted as a working prototype demonstrating how AI-powered digital deflection can reduce branch congestion at scale while maintaining strict data privacy compliance.
 
---
 
## Why This is Agentic AI
 
Most banking bots rely on keyword matching and hardcoded `if/else` routing logic. This system is fundamentally different:
 
- **ReAct Architecture** — The LLM runs a continuous Thought → Action → Observation loop via `create_react_agent`. It reasons about the query, picks a tool, reads the result, and formulates a response autonomously.
- **No Hardcoded Routing** — There is zero programmed decision logic determining what the user wants. The agent reads each tool's description and independently decides which one to invoke.
- **Autonomous Tool Selection** — Banking functions (statement generation, card freezing, KYC, policy lookup) are exposed as tools. The AI selects the right one based purely on the customer's natural language input.
- **Dynamic Fallback** — If no tool fits the query, the agent autonomously escalates to a branch without any explicit fallback code — it reasons its way to that decision.
- **RAG-Grounded Responses** — The `search_sbi_policies` tool queries a local FAISS vector store. The agent decides when to use it and what to retrieve, making it context-aware rather than just reactive.
 

