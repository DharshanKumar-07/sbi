import React, { useState } from 'react';
import { Shield, FileText, Send, Building, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Welcome to SBI Assist. How can I help you avoid a branch visit today?', type: 'text' }
  ]);
  const [pipelineState, setPipelineState] = useState(null);
  const [metrics, setMetrics] = useState({ deflected: 0, escalated: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Widget Actions (UI interactions)
  const handleWidgetAction = (actionType) => {
    let replyText = "";
    if (actionType === 'download_statement') replyText = "✅ Your E-Statement has been generated successfully and sent to your email.";
    else if (actionType === 'freeze_card') replyText = "🔒 Success: Your card has been temporarily frozen. You can unblock it anytime from YONO.";
    else if (actionType === 'start_kyc') replyText = "📹 Connecting you to the next available Video KYC agent...";
    else if (actionType === 'generate_token') replyText = "🎟️ Branch Token #SB-9941 generated. Please show this at Counter 3.";

    if (replyText) {
      setMessages(prev => [...prev, { role: 'assistant', text: replyText, type: 'text' }]);
    }
  };

  // REAL API Integration - Talks to Python/Ollama!
  const callBackend = async (message) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, user_id: "mock-user-123" }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Backend connection error:", error);
      return null;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    const newMessages = [...messages, { role: 'user', text: userMessage, type: 'text' }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Call the REAL backend
    const response = await callBackend(userMessage);
    
    setIsLoading(false);

    if (response && response.routing_decision) {
      setPipelineState({
        intent: response.intent,
        confidence: response.confidence,
        routing: response.routing_decision,
        workflow: response.workflow_state
      });
      
      if (response.routing_decision.includes('DIGITAL')) {
        setMetrics(m => ({ ...m, deflected: m.deflected + 1 }));
      } else {
        setMetrics(m => ({ ...m, escalated: m.escalated + 1 }));
      }

      setMessages([...newMessages, 
        { role: 'assistant', text: response.reply, type: 'text' },
        { role: 'assistant', payload: response.workflow_state, type: 'widget' }
      ]);
    } else {
      // If Python isn't running, it will show this error!
      setMessages([...newMessages, { role: 'assistant', text: "❌ Connection Error: Ensure your Python backend (main.py) is running on port 8000.", type: 'text' }]);
    }
  };

  const renderWidget = (payload) => {
    if (!payload || Object.keys(payload).length === 0) return null;
    
    switch (payload.type) {
      case 'form_statement':
        return (
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm mt-2">
            <h4 className="font-semibold text-slate-800 flex items-center mb-3"><FileText className="w-4 h-4 mr-2 text-blue-600"/> E-Statement Request</h4>
            <div className="flex gap-2 mb-3">
              <input type="date" className="border rounded p-2 text-sm w-full" />
              <input type="date" className="border rounded p-2 text-sm w-full" />
            </div>
            <button onClick={() => handleWidgetAction('download_statement')} className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 transition">Download PDF</button>
          </div>
        );
      case 'secure_toggle':
        return (
          <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm mt-2">
            <h4 className="font-semibold text-slate-800 flex items-center mb-3"><Shield className="w-4 h-4 mr-2 text-red-500"/> Card Security</h4>
            <p className="text-sm text-slate-600 mb-3">{payload.target || "Debit Card"}</p>
            <button onClick={() => handleWidgetAction('freeze_card')} className="w-full bg-red-500 text-white rounded py-2 text-sm font-medium hover:bg-red-600 transition">Confirm Freeze</button>
          </div>
        );
      case 'checklist':
        return (
           <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm mt-2">
            <h4 className="font-semibold text-slate-800 flex items-center mb-3"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600"/> KYC Checklist</h4>
            <button onClick={() => handleWidgetAction('start_kyc')} className="w-full bg-emerald-600 text-white rounded py-2 text-sm font-medium hover:bg-emerald-700 transition">Initiate Video Call</button>
          </div>
        );
      case 'escalation_ticket':
         return (
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
            <h4 className="font-semibold text-slate-800 flex items-center mb-2"><Building className="w-4 h-4 mr-2 text-slate-600"/> Branch Handoff</h4>
            <button onClick={() => handleWidgetAction('generate_token')} className="w-full bg-slate-800 text-white rounded py-2 text-sm font-medium hover:bg-slate-900 transition">Generate Branch Token</button>
          </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex flex-col md:flex-row gap-6">
      <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-[#280175] text-white p-4 flex justify-between items-center shadow-md z-10">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#280175] font-bold text-xs leading-none">SBI</span>
             </div>
             <h1 className="font-bold text-lg text-white tracking-wider">YONO Deflection Agent</h1>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-[#280175] text-white rounded-2xl rounded-tr-sm px-4 py-2' : ''}`}>
                {msg.type === 'text' && msg.role === 'assistant' && (
                  <div className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm inline-block">
                    {msg.text}
                  </div>
                )}
                {msg.type === 'text' && msg.role === 'user' && msg.text}
                {msg.type === 'widget' && renderWidget(msg.payload)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-white border border-slate-200 px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm inline-block">
                <div className="flex space-x-1.5 items-center h-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your query..." className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#280175]" />
          <button type="submit" className="bg-[#280175] text-white rounded-full w-10 h-10 flex items-center justify-center"><Send className="w-4 h-4" /></button>
        </form>
      </div>
      
      <div className="w-full md:w-96 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-lg border p-5">
           <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Live Analytics</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-3 text-center rounded-xl"><div className="text-2xl font-black text-emerald-600">{metrics.deflected}</div><div className="text-xs">Avoided</div></div>
              <div className="bg-orange-50 p-3 text-center rounded-xl"><div className="text-2xl font-black text-orange-600">{metrics.escalated}</div><div className="text-xs">Escalated</div></div>
           </div>
        </div>
        <div className="bg-white flex-1 rounded-2xl shadow-lg border p-5">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Architecture Pipeline</h3>
          <div className="space-y-3">
             <div className="text-xs text-slate-500 font-mono">Status: {pipelineState ? 'Connected' : 'Idle'}</div>
             {pipelineState && (
                <div className="text-sm border-l-4 border-blue-500 pl-3">
                  <div>Intent: <span className="font-bold">{pipelineState.intent}</span></div>
                  <div>Confidence: {(pipelineState.confidence * 100).toFixed(0)}%</div>
                  <div>Route: {pipelineState.routing}</div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}