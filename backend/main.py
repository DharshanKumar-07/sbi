from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any
import os

# Modern LangChain & AI Imports
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

app = FastAPI(title="SBI Branch Deflection Assistant API")

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
    intent: str
    confidence: float
    routing_decision: str
    workflow_state: Dict[str, Any]
    reply: str

class IntentSchema(BaseModel):
    intent: str = Field(description="Must be exactly one of: statement, card_control, failed_transaction, kyc_help, conversational, general_inquiry, or branch_request")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")

# --- AI Engines ---

class IntentClassifier:
    def __init__(self):
        self.llm = ChatOllama(model="llama3", temperature=0).with_structured_output(IntentSchema)
        self.prompt = PromptTemplate.from_template(
            """Analyze the user's message and classify their core intent.
            
            Categories:
            - statement: Account history, balance, transaction records.
            - card_control: Block, freeze, unblock, lost card.
            - failed_transaction: UPI failure, money deducted.
            - kyc_help: Update address, document requirements.
            - conversational: Greetings, 'thank you', 'hello'.
            - general_inquiry: Anything requiring bank policy info (interest rates, FD tenures, branch hours).
            - branch_request: Explicitly asking for human help, branch manager, or a complex issue.
            
            User Message: {message}"""
        )
        self.chain = self.prompt | self.llm
    
    def classify(self, text: str) -> dict:
        try:
            result = self.chain.invoke({"message": text})
            return {"intent": result.intent, "confidence": result.confidence}
        except Exception as e:
            print(f"Classification Error: {e}")
            return {"intent": "branch_request", "confidence": 0.2}

class RAGEngine:
    def __init__(self):
        if not os.path.exists("./data/sbi_policies.txt"):
            os.makedirs("./data", exist_ok=True)
            with open("./data/sbi_policies.txt", "w") as f:
                f.write("SBI Savings Interest Rate is 2.70%. Min balance for Metro is 3000 INR. KYC requires PAN, Aadhaar, photos. Video KYC is available.")
        
        loader = TextLoader("./data/sbi_policies.txt")
        docs = loader.load()
        splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        split_docs = splitter.split_documents(docs)
        
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vectorstore = FAISS.from_documents(split_docs, embeddings)
        self.retriever = self.vectorstore.as_retriever()
        
        self.llm = ChatOllama(model="llama3")
        self.prompt = PromptTemplate.from_template(
            "You are an SBI Assistant. Answer the question based strictly on the following context.\n\nContext: {context}\n\nQuestion: {question}"
        )

    def format_docs(self, docs):
        return "\n\n".join(doc.page_content for doc in docs)

    def get_answer(self, query: str):
        qa_chain = (
            {"context": self.retriever | self.format_docs, "question": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )
        answer = qa_chain.invoke(query)
        return {"result": answer}

# --- Logic ---

classifier = IntentClassifier()
rag = RAGEngine()

@app.post("/api/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    # 1. Classify
    classif = classifier.classify(request.message)
    intent = classif["intent"]
    confidence = classif["confidence"]
    
    # 2. Logic handling
    reply = ""
    workflow_data = {}
    routing = "BRANCH_ESCALATION" # Default

    # AI Safeguard: If AI is confused, safely escalate!
    if confidence < 0.60 or intent == "branch_request":
        intent = "branch_request" if confidence >= 0.60 else "complex_query"
        reply = "This looks like a complex request. I've prepared a summary so our branch staff can assist you quickly without you having to repeat yourself."
        routing = "BRANCH_ESCALATION"
        workflow_data = {"type": "escalation_ticket"}
        
    elif intent == "conversational":
        reply = "I'm happy to help! Let me know if you have any questions about SBI services."
        routing = "DIGITAL_INFORMATIONAL"
        
    elif intent == "general_inquiry":
        res = rag.get_answer(request.message)
        reply = res["result"]
        routing = "DIGITAL_INFORMATIONAL"
        
    else:
        # Mapping standard digital workflows
        routing = "DIGITAL_SELF_SERVE" if intent in ["statement", "kyc_help"] else "DIGITAL_HIGH_AUTH"
        replies = {
            "statement": "I can help you get your account statement instantly.",
            "card_control": "I understand you need to manage your debit card.",
            "failed_transaction": "Failed UPI transactions usually settle within 3 days. Let's check your status.",
            "kyc_help": "You can update your KYC from home using V-KYC."
        }
        reply = replies.get(intent, "I can assist you with that digitally.")
        
        workflows = {
            "statement": {"type": "form_statement"},
            "card_control": {"type": "secure_toggle", "target": "Debit Card ending 4012"},
            "kyc_help": {"type": "checklist"}
        }
        workflow_data = workflows.get(intent, {})

    return ChatResponse(
        intent=intent,
        confidence=confidence,
        routing_decision=routing,
        workflow_state=workflow_data,
        reply=reply
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)