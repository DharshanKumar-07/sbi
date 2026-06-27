# SBI YONO Deflection Agent

**Intelligent, Privacy-First Branch Traffic Management**

The SBI YONO Deflection Agent is a full-stack, AI-driven solution designed to reduce physical branch congestion by intelligently routing customer queries to secure, digital self-serve workflows. Built specifically for high-scale banking environments, the system uses local LLM inference to ensure zero customer data exposure to third-party providers.

---

## The Problem

SBI branches experience massive footfall for routine queries — balance checks, account statements, card blocking, KYC updates, and more. This creates significant operational overhead for branch staff and long wait times for customers, most of whom could have been served digitally.

---

## The Solution

A **Traffic Deflection Engine** that:

- Classifies complex, natural-language customer queries by intent
- Orchestrates specific banking workflows based on the detected intent
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
                               │
                               ▼
                  Llama 3 via Ollama (Local Inference)
                               │
                 ┌─────────────┴──────────────┐
                 ▼                            ▼
       Digital Self-Service             Branch Escalation
          (YONO Redirect)                 (Staff Queue)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | FastAPI (Python) |
| AI / LLM | Llama 3 via Ollama |
| Orchestration | LangChain |
| Language | Python 3.10+, JavaScript |

---

## Setup Instructions

### Prerequisites

- Node.js installed
- Python 3.10 or higher
- Ollama installed and running
- Create a virtual enviornment to avoid inconsistencies

### 1. Backend Setup

```bash
# Clone the repository and navigate to the project root
pip install -r requirements.txt
pip install langchain langchain-ollama pydantic

# Pull and run the Llama 3 model via Ollama
ollama run llama3

# Start the FastAPI server
python backend/main.py
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
- **No Third-Party API Calls** — Unlike cloud-hosted LLM solutions, there is zero dependency on external AI providers for query processing.
- **Horizontal Scalability** — The local Ollama instance can be replaced with fine-tuned models hosted in a private, load-balanced container cluster for production-scale deployments.

---

## Project Structure

```
sbi-yono-deflection-agent/
├── backend/
│   ├── main.py               # FastAPI entry point
│   ├── classifier.py         # LangChain + Ollama intent classification
│   ├── policy_engine.py      # Deflection vs escalation logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React UI components
│   │   └── App.jsx           # Root component
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## Built For

SBI Innovation Hackathon — submitted as a working prototype demonstrating how AI-powered digital deflection can reduce branch congestion at scale while maintaining strict data privacy compliance.
