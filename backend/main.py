from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
import warnings
import os

# --- RAG Imports ---
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter

# Suppress harmless deprecation warnings for a clean terminal during your demo
warnings.filterwarnings("ignore", category=DeprecationWarning)

app = FastAPI(title="SBI Agentic Workflow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class ChatRequest(BaseModel):
    message: str
    user_id: str = "mock-user-123"

class ChatResponse(BaseModel):
    agent_tool: str
    confidence: float
    routing_decision: str
    workflow_state: Dict[str, Any]
    reply: str


# --- Initialize RAG Vector Store ---
if not os.path.exists("./data/sbi_policies.txt"):
    os.makedirs("./data", exist_ok=True)
    with open("./data/sbi_policies.txt", "w") as f:
        f.write("SBI Savings Interest Rate is 2.70%. Min balance for Metro is 3000 INR. KYC requires PAN, Aadhaar, photos. Video KYC is available.")

loader = TextLoader("./data/sbi_policies.txt")
docs = loader.load()
splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
split_docs = splitter.split_documents(docs)

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = FAISS.from_documents(split_docs, embeddings)
retriever = vectorstore.as_retriever()


# --- Agentic Tools ---
@tool
def generate_statement(query: str) -> dict:
    """Use this tool when the user wants to download or view their account statement, passbook, or transaction history."""
    return {"tool": "generate_statement", "routing": "DIGITAL_SELF_SERVE", "workflow": {"type": "form_statement"}}

@tool
def freeze_debit_card(query: str) -> dict:
    """Use this tool when the user wants to block, freeze, or secure their debit/credit card."""
    return {"tool": "freeze_debit_card", "routing": "DIGITAL_HIGH_AUTH", "workflow": {"type": "secure_toggle", "target": "Debit Card ending 4012"}}

@tool
def start_video_kyc(query: str) -> dict:
    """Use this tool when the user wants to update their KYC, submit documents, or update their address."""
    return {"tool": "start_video_kyc", "routing": "DIGITAL_INFORMATIONAL", "workflow": {"type": "checklist"}}

@tool
def search_sbi_policies(query: str) -> str:
    """Use this tool to answer general banking inquiries, interest rates, loan details, fees, limits, and bank policies.
    Pass the user's specific question as the query."""
    # Retrieve relevant documents from the local text file
    retrieved_docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in retrieved_docs)

@tool
def escalate_to_branch(query: str) -> dict:
    """Use this tool when the user explicitly asks for human help, a manager, a branch visit, or if no other tool fits."""
    return {"tool": "escalate_to_branch", "routing": "BRANCH_ESCALATION", "workflow": {"type": "escalation_ticket"}}


# Added the new RAG tool to the agent's toolkit
tools = [generate_statement, freeze_debit_card, start_video_kyc, search_sbi_policies, escalate_to_branch]

llm = ChatOllama(model="llama3.1", temperature=0)

# Create the autonomous ReAct Agent
agent_executor = create_react_agent(llm, tools)

# --- API Route ---
@app.post("/api/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    try:
        # 1. Let the Agent autonomously process the message
        state = agent_executor.invoke({"messages": [HumanMessage(content=request.message)]})
        
        # 2. Defaults in case the agent is unsure
        tool_called = "escalate_to_branch"
        routing = "BRANCH_ESCALATION"
        workflow = {"type": "escalation_ticket"}
        reply = "I have processed your request, but this requires branch assistance."
        
        # 3. Extract the tool decision the AI made from the state history
        messages = state.get("messages", [])
        
        # Find which tool the agent decided to use
        for msg in reversed(messages):
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                tool_called = msg.tool_calls[0]['name']
                break
        
        # 4. Map the agent's choice to our frontend UI workflows
        if tool_called == "generate_statement":
            routing = "DIGITAL_SELF_SERVE"
            workflow = {"type": "form_statement"}
            reply = "I can help you get your account statement instantly."
            
        elif tool_called == "freeze_debit_card":
            routing = "DIGITAL_HIGH_AUTH"
            workflow = {"type": "secure_toggle", "target": "Debit Card ending 4012"}
            reply = "I understand you need to manage your debit card security. Let's get that frozen."
            
        elif tool_called == "start_video_kyc":
            routing = "DIGITAL_INFORMATIONAL"
            workflow = {"type": "checklist"}
            reply = "You can update your KYC right from home using Video KYC. Here is the checklist."
            
        elif tool_called == "search_sbi_policies":
            routing = "DIGITAL_INFORMATIONAL"
            workflow = {"type": "policy_info"} 
            # If it's a policy question, use the Agent's actual generated answer instead of a hardcoded string!
            reply = messages[-1].content if messages[-1].content else "I found the policy information you requested."
            
        elif tool_called == "escalate_to_branch":
            if messages[-1].content:
                reply = messages[-1].content
                
        return ChatResponse(
            agent_tool=tool_called,
            confidence=0.95,
            routing_decision=routing,
            workflow_state=workflow,
            reply=reply
        )
    except Exception as e:
        print(f"Backend Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)