import React, { useState } from 'react';
import { Shield, FileText, CreditCard, AlertCircle, RefreshCw, Send, Building, User, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Welcome to SBI Assist. How can I help you avoid a branch visit today?', type: 'text' }
  ]);
  const [pipelineState, setPipelineState] = useState(null);
  const [metrics, setMetrics] = useState({ deflected: 0, escalated: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Handle interactions with the widgets (Mocking the final action)
  const handleWidgetAction = (actionType) => {
    let replyText = "";
    
    if (actionType === 'download_statement') {
      replyText = "✅ Your E-Statement has been generated successfully. A copy has also been sent to your registered email address.";
    } else if (actionType === 'freeze_card') {
      replyText = "🔒 Success: Your card has been temporarily frozen. You can unblock it anytime from the YONO app.";
    } else if (actionType === 'start_kyc') {
      replyText = "📹 Connecting you to the next available Video KYC agent. Please keep your physical PAN card ready...";
    } else if (actionType === 'generate_token') {
      replyText = "🎟️ Branch Token #SB-9941 generated. Please show this at Counter 3 at your nearest branch.";
    }

    if (replyText) {
      setMessages(prev => [...prev, { role: 'assistant', text: replyText, type: 'text' }]);
    }
  };

  // Simulated Backend call for frontend-only prototyping
  const simulateBackendCall = (message) => {
    const text = message.toLowerCase();
    let intent, routing, workflow, reply;

    if (text.includes('statement') || text.includes('passbook')) {
      intent = 'statement'; routing = 'DIGITAL_SELF_SERVE';
      workflow = { type: 'form_statement', action: 'Generate E-Statement' };
      reply = "I can help you get your account statement instantly without visiting a branch. Select your dates:";
    } else if (text.includes('card') || text.includes('block') || text.includes('wallet')) {
      intent = 'card_control'; routing = 'DIGITAL_HIGH_AUTH';
      workflow = { type: 'secure_toggle', action: 'Freeze Card ending 4012' };
      reply = "I can help you secure your card digitally. Please confirm the block action:";
    } else if (text.includes('kyc') || text.includes('document')) {
      intent = 'kyc_help'; routing = 'DIGITAL_INFORMATIONAL';
      workflow = { type: 'checklist', action: 'Start Video KYC' };
      reply = "You can update your KYC from home using YONO. Here is the checklist:";
    } else if (text.includes('failed') || text.includes('upi')) {
      intent = 'failed_transaction'; routing = 'DIGITAL_ASSISTED';
      workflow = { type: 'ticket_status', action: 'Raise Dispute' };
      reply = "Let's check your recent failed transaction and raise a digital dispute.";
    } else {
      intent = 'complex_query'; routing = 'BRANCH_ESCALATION';
      workflow = { type: 'escalation_ticket', action: 'Generate Branch Token' };
      reply = "This request requires branch assistance. I've prepared a summary so you won't have to repeat yourself.";
    }

    return { intent, routing, workflow, reply, confidence: 0.95 };
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add User Message
    const newMessages = [...messages, { role: 'user', text: input, type: 'text' }];
    setMessages(newMessages);
    setInput('');
    
    // Show typing dots
    setIsLoading(true);

    // Process through "Backend" with a slightly longer delay to show the loading dots
    setTimeout(() => {
      const response = simulateBackendCall(input);
      
      // Update Pipeline Visualizer
      setPipelineState(response);
      
      // Update Metrics
      if (response.routing.includes('DIGITAL')) {
        setMetrics(m => ({ ...m, deflected: m.deflected + 1 }));
      } else {
        setMetrics(m => ({ ...m, escalated: m.escalated + 1 }));
      }

      // Add Assistant Reply & Interactive Card
      setMessages([...newMessages, 
        { role: 'assistant', text: response.reply, type: 'text' },
        { role: 'assistant', payload: response.workflow, type: 'widget' }
      ]);
      
      // Hide typing dots
      setIsLoading(false);
    }, 1200);
  };

  // Widget Renderers
  const renderWidget = (payload) => {
    if (!payload) return null;
    
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
            <p className="text-sm text-slate-600 mb-3">Debit Card: **** **** **** 4012</p>
            <button onClick={() => handleWidgetAction('freeze_card')} className="w-full bg-red-500 text-white rounded py-2 text-sm font-medium hover:bg-red-600 transition flex justify-center items-center">
               Confirm Temporary Freeze
            </button>
          </div>
        );
      case 'checklist':
        return (
           <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm mt-2">
            <h4 className="font-semibold text-slate-800 flex items-center mb-3"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600"/> Video KYC Checklist</h4>
            <ul className="text-sm text-slate-600 space-y-2 mb-4">
              <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-slate-400"/> Original Aadhaar Card</li>
              <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-slate-400"/> Original PAN Card</li>
              <li className="flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-slate-400"/> Blank paper & blue/black pen</li>
            </ul>
            <button onClick={() => handleWidgetAction('start_kyc')} className="w-full bg-emerald-600 text-white rounded py-2 text-sm font-medium hover:bg-emerald-700 transition">Initiate Video Call</button>
          </div>
        );
      case 'escalation_ticket':
         return (
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm mt-2">
            <h4 className="font-semibold text-slate-800 flex items-center mb-2"><Building className="w-4 h-4 mr-2 text-slate-600"/> Branch Handoff Summary</h4>
            <p className="text-xs text-slate-500 mb-3 border-l-2 border-slate-300 pl-2">Ticket #SB-9941. Context passed to branch manager.</p>
            <button onClick={() => handleWidgetAction('generate_token')} className="w-full bg-slate-800 text-white rounded py-2 text-sm font-medium hover:bg-slate-900 transition">Generate Branch Token</button>
          </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex flex-col md:flex-row gap-6">
      
      {/* LEFT COLUMN: Customer Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-[#280175] text-white p-4 flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#280175] font-bold text-xs leading-none">SBI</span>
             </div>
             <div>
               <h1 className="font-bold text-lg leading-tight text-white tracking-wider">YONO Deflection Agent</h1>
             </div>
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
          
          {/* Enhanced Loading Indicator Chat Bubble */}
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

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. 'I need last 6 months statement'..." 
            className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-[#280175] focus:ring-1 focus:ring-[#280175]"
          />
          <button type="submit" className="bg-[#280175] text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-[#1a004f] transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Architecture & Metrics Dashboard (For Judges) */}
      <div className="w-full md:w-96 flex flex-col gap-4">
        
        {/* Metrics Panel */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Live Analytics</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 text-center">
                 <div className="text-2xl font-black text-emerald-600">{metrics.deflected}</div>
                 <div className="text-xs font-semibold text-emerald-800">Branch Visits<br/>Avoided</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-center">
                 <div className="text-2xl font-black text-orange-600">{metrics.escalated}</div>
                 <div className="text-xs font-semibold text-orange-800">Escalated to<br/>Branch</div>
              </div>
           </div>
        </div>

        {/* Pipeline Visualizer Panel */}
        <div className="bg-white flex-1 rounded-2xl shadow-lg border border-slate-200 p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Under The Hood: Architecture</h3>
          
          <div className="flex-1 space-y-4">
            
            {/* Step 1: Intent */}
            <div className={`p-3 rounded-lg border ${pipelineState ? 'border-blue-300 bg-blue-50' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
               <div className="flex justify-between items-center mb-1">
                 <span className="text-xs font-bold text-blue-800">1. LLM Intent Classifier</span>
                 {pipelineState && <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{(pipelineState.confidence * 100).toFixed(0)}% Conf</span>}
               </div>
               <div className="text-sm text-slate-600 font-mono">
                 {pipelineState ? `"${pipelineState.intent}"` : 'Waiting for input...'}
               </div>
            </div>

            {/* Step 2: Policy Engine */}
            <div className={`p-3 rounded-lg border ${pipelineState ? 'border-purple-300 bg-purple-50' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
               <div className="text-xs font-bold text-purple-800 mb-1">2. Rules / Policy Engine</div>
               <div className="text-sm text-slate-600 font-mono flex items-center">
                 <Shield className="w-3 h-3 mr-2" />
                 {pipelineState ? pipelineState.routing : 'Evaluating rules...'}
               </div>
            </div>

            {/* Step 3: Workflow / Action */}
            <div className={`p-3 rounded-lg border ${pipelineState ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
               <div className="text-xs font-bold text-emerald-800 mb-1">3. Workflow Orchestrator</div>
               <div className="text-sm text-slate-600 font-mono">
                 {pipelineState ? `Trigger: ${pipelineState.workflow.type}` : 'Executing action...'}
               </div>
            </div>

          </div>
          
          <div className="mt-4 p-3 bg-slate-800 text-slate-200 text-xs rounded-lg font-mono leading-relaxed">
            <span className="text-green-400"># System Status</span><br/>
            API Gateway: Online<br/>
            RAG Vector DB: Connected<br/>
            SBI Core Sync: T-minus 1ms
          </div>
        </div>

      </div>
    </div>
  );
}