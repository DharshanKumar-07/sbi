from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any
import os

from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

app = FastAPI(title="SBI Branch Deflection Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class ChatRequest(BaseModel):
    message: str
    user_id: str = "mock-user-123"

class ChatResponse(BaseModel):
    intent: str
    confidence: float
    routing_decision: str
    workflow_state: Dict[str, Any]
    reply: str

# --- 1. NEW: LLM Intent Classifier ---
class IntentSchema(BaseModel):
    """Schema forcing the LLM to output exact intent classifications."""
    intent: str = Field(description="Must be exactly one of: statement, card_control, failed_transaction, kyc_help, or general_inquiry")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")

class IntentClassifier:
    def __init__(self):
        # Initialize Ollama pointing to your local instance
        self.llm = ChatOllama(
            model="llama3", 
            temperature=0
        ).with_structured_output(IntentSchema)
        
        self.prompt = PromptTemplate.from_template(
            """You are the routing brain for SBI's digital deflection agent.
            Analyze the user's message and classify their core intent.
            
            Categories:
            - statement: Wants account history, passbook printing, or transaction records.
            - card_control: Needs to block, freeze, unblock, or report a lost debit/credit card.
            - failed_transaction: Reporting money deducted but not received, UPI failures, IMPS issues.
            - kyc_help: Asking about account updates, address changes, or document requirements.
            - general_inquiry: Anything else that requires complex human help or branch visits.
            
            User Message: {message}"""
        )
        self.chain = self.prompt | self.llm
    
    def classify(self, text: str) -> dict:
        try:
            # Call the local Ollama model
            result = self.chain.invoke({"message": text})
            return {"intent": result.intent, "confidence": result.confidence}
        except Exception as e:
            print(f"Ollama Routing Error: {e}")
            return {"intent": "general_inquiry", "confidence": 0.3}

# --- 2. Policy & Eligibility Engine ---
class PolicyEngine:
    def evaluate(self, intent: str, user_context: dict) -> str:
        rules = {
            "statement": "DIGITAL_SELF_SERVE",
            "card_control": "DIGITAL_HIGH_AUTH",
            "failed_transaction": "DIGITAL_ASSISTED",
            "kyc_help": "DIGITAL_INFORMATIONAL",
            "general_inquiry": "BRANCH_ESCALATION"
        }
        return rules.get(intent, "BRANCH_ESCALATION")

# --- 3. Workflow Executor ---
class WorkflowExecutor:
    def execute(self, intent: str, routing: str) -> dict:
        workflows = {
            "statement": {
                "type": "form_statement",
                "action": "Generate E-Statement via YONO 2.0 API"
            },
            "card_control": {
                "type": "secure_toggle",
                "target": "Debit Card ending in 4012",
                "action": "Require OTP to Freeze"
            },
            "failed_transaction": {
                "type": "ticket_status",
                "npc_timeline": "T+3 Days",
                "action": "Raise Dispute"
            },
            "kyc_help": {
                "type": "checklist",
                "action": "Schedule Video KYC"
            }
        }
        
        if routing == "BRANCH_ESCALATION":
            return {
                "type": "escalation_ticket",
                "summary": "User issue requires manual intervention.",
                "action": "Generate Branch Token"
            }
            
        return workflows.get(intent, {})

# --- Initialize Modules ---
classifier = IntentClassifier()
policy = PolicyEngine()
workflow = WorkflowExecutor()

# --- API Endpoints ---
@app.post("/api/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    try:
        classification = classifier.classify(request.message)
        intent = classification["intent"]
        
        mock_user_context = {"is_authenticated": True, "risk_score": "low"}
        routing = policy.evaluate(intent, mock_user_context)
        
        workflow_data = workflow.execute(intent, routing)
        
        replies = {
            "statement": "I can help you get your account statement instantly without visiting a branch. Please select the date range below.",
            "card_control": "I understand you need to manage your debit card. We can secure it right now digitally. Please confirm the action below.",
            "failed_transaction": "Failed UPI transactions usually settle within 3 days. Let's fetch your recent transactions to raise a dispute.",
            "kyc_help": "You don't need to visit a branch to update your KYC! Here is what you need for Video KYC.",
            "general_inquiry": "This request might require specialized assistance. I've prepared a summary ticket so our branch staff knows exactly what you need when you arrive."
        }
        
        return ChatResponse(
            intent=intent,
            confidence=classification["confidence"],
            routing_decision=routing,
            workflow_state=workflow_data,
            reply=replies.get(intent, "I can help route this to the right team.")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)