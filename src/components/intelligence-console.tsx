"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, BarChart3, Check, ChevronRight, CircleDollarSign, Database, Loader2, Menu, MessageSquareText, RefreshCw, Send, Settings2, ShieldCheck, Sparkles, X } from "lucide-react";
import type { BIResult } from "@/types/bi";
import { MarkdownLite } from "./markdown-lite";

type ChatItem = { role: "user"; text: string } | { role: "assistant"; result: BIResult } | { role: "assistant"; text: string; error?: boolean };
type Config = { ready: boolean; config: Record<string, boolean> };

const prompts = [
  "How is our energy sector pipeline looking this quarter?",
  "Where is our receivables risk concentrated?",
  "Which work orders are creating execution risk?",
  "Prepare a concise leadership update.",
];

function Logo() {
  return <div className="logo"><div className="logo-mark"><span /><span /><span /></div><div><strong>SKYLARK</strong><small>INTELLIGENCE</small></div></div>;
}

export function IntelligenceConsole() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const refreshStatus = async () => {
    try { const r = await fetch("/api/status", { cache: "no-store" }); setConfig(await r.json()); }
    catch { setConfig({ ready: false, config: {} }); }
  };
  useEffect(() => { refreshStatus(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function ask(raw?: string) {
    const text = (raw ?? question).trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]); setQuestion(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The analysis could not be completed.");
      if (data.clarification) setMessages((m) => [...m, { role: "assistant", text: data.clarification }]);
      else setMessages((m) => [...m, { role: "assistant", result: data }]);
    } catch (error) {
      setMessages((m) => [...m, { role: "assistant", text: error instanceof Error ? error.message : "Something went wrong.", error: true }]);
      if (!config?.ready) setSetupOpen(true);
    } finally { setLoading(false); }
  }

  return <main className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-top"><Logo /><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <button className="new-analysis" onClick={() => { setMessages([]); setSidebarOpen(false); }}><Sparkles size={17}/> New analysis</button>
      <nav>
        <p className="nav-label">Workspace</p>
        <button className="nav-item active"><MessageSquareText size={18}/> Ask intelligence</button>
        <button className="nav-item" onClick={() => ask("Prepare a concise leadership update.")}><BarChart3 size={18}/> Leadership update</button>
        <p className="nav-label second">Data sources</p>
        <div className="source-row"><span className="source-icon deals"><CircleDollarSign size={16}/></span><div><strong>Deals</strong><small>Monday.com board</small></div><i className={config?.config?.dealsBoard ? "connected" : ""}/></div>
        <div className="source-row"><span className="source-icon orders"><Database size={16}/></span><div><strong>Work Orders</strong><small>Monday.com board</small></div><i className={config?.config?.workOrdersBoard ? "connected" : ""}/></div>
      </nav>
      <div className="sidebar-bottom">
        <button className="setup-button" onClick={() => setSetupOpen(true)}><Settings2 size={17}/><span><strong>Integration setup</strong><small>{config?.ready ? "All systems ready" : "Configuration required"}</small></span><ChevronRight size={16}/></button>
        <div className="read-only"><ShieldCheck size={15}/> Read-only Monday access</div>
      </div>
    </aside>
    {sidebarOpen && <button aria-label="Close sidebar" className="scrim" onClick={() => setSidebarOpen(false)}/>} 

    <section className="main-panel">
      <header className="topbar"><button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><div><span className={`status-dot ${config?.ready ? "" : "warning"}`}/>{config?.ready ? "Live data connected" : "Setup required"}</div><button onClick={refreshStatus}><RefreshCw size={15}/> Sync status</button></header>
      <div className={`conversation ${messages.length ? "has-messages" : ""}`}>
        {!messages.length ? <div className="welcome">
          <div className="eyebrow"><Sparkles size={14}/> EXECUTIVE INTELLIGENCE</div>
          <h1>Ask the business.<br/><em>Know what matters.</em></h1>
          <p>Live, explainable answers across pipeline, revenue, collections and project execution—grounded in your Monday.com boards.</p>
          {!config?.ready && <button className="configuration-banner" onClick={() => setSetupOpen(true)}><AlertTriangle size={18}/><span><strong>Finish integration setup</strong><small>Add the Monday board IDs and server-side tokens before running live analysis.</small></span><ArrowUpRight size={17}/></button>}
          <div className="prompt-grid">{prompts.map((p, i) => <button key={p} onClick={() => ask(p)}><span>{i + 1}</span>{p}<ArrowUpRight size={16}/></button>)}</div>
        </div> : <div className="message-list">
          {messages.map((m, i) => m.role === "user" ? <div className="user-message" key={i}><span>You</span><p>{m.text}</p></div> : "result" in m ? <ResultCard key={i} result={m.result}/> : <div className={`assistant-note ${m.error ? "error" : ""}`} key={i}><Sparkles size={17}/><p>{m.text}</p></div>)}
          {loading && <div className="thinking"><Loader2 className="spin" size={18}/><div><strong>Analyzing live boards</strong><span>Normalizing records and calculating business metrics…</span></div></div>}
          <div ref={endRef}/>
        </div>}
      </div>
      <div className="composer-wrap"><div className="composer"><textarea aria-label="Business question" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} placeholder="Ask about pipeline, revenue, sectors, collections or execution…" rows={1}/><button aria-label="Send question" disabled={!question.trim() || loading} onClick={() => ask()}>{loading ? <Loader2 className="spin" size={19}/> : <Send size={18}/>}</button></div><p>Numbers are calculated deterministically; AI explains the result. Verify decisions against source records.</p></div>
    </section>
    {setupOpen && <SetupModal config={config} onClose={() => setSetupOpen(false)} onRefresh={refreshStatus}/>} 
  </main>;
}

function ResultCard({ result }: { result: BIResult }) {
  return <article className="result-card">
    <div className="result-heading"><div className="ai-avatar"><Sparkles size={18}/></div><div><strong>Skylark Intelligence</strong><small>Analyzed {new Date(result.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div></div>
    <MarkdownLite text={result.answer}/>
    <div className="metric-grid">{result.metrics.map((m) => <div className="metric" key={m.label}><span>{m.label}</span><strong>{m.value}</strong>{m.detail && <small>{m.detail}</small>}</div>)}</div>
    <div className="insight-section"><h3>What deserves attention</h3>{result.insights.map((x) => <p key={x}><ChevronRight size={15}/>{x}</p>)}</div>
    {result.caveats.length > 0 && <details className="caveats"><summary><AlertTriangle size={15}/> Data quality notes <span>{result.caveats.length}</span></summary>{result.caveats.map((x) => <p key={x}>{x}</p>)}</details>}
    <footer>{result.sources.map((s) => <span key={s.board}><Check size={13}/>{s.board}: {s.rowsUsed}/{s.rowsAvailable} rows used</span>)}</footer>
  </article>;
}

function SetupModal({ config, onClose, onRefresh }: { config: Config | null; onClose: () => void; onRefresh: () => void }) {
  const rows = [
    ["Monday API token", "mondayToken"], ["Deals board ID", "dealsBoard"], ["Work Orders board ID", "workOrdersBoard"], ["Hugging Face token", "hfToken"],
  ] as const;
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="setup-modal" onMouseDown={(e) => e.stopPropagation()}>
    <div className="modal-title"><div><span>INTEGRATION HEALTH</span><h2>Connect live business data</h2></div><button onClick={onClose}><X size={20}/></button></div>
    <p className="modal-intro">Secrets stay server-side. The app requests board data at query time and never writes back to Monday.com.</p>
    <div className="config-list">{rows.map(([label, id]) => <div key={id}><span className={config?.config?.[id] ? "ok" : "missing"}>{config?.config?.[id] ? <Check size={14}/> : "!"}</span><strong>{label}</strong><small>{config?.config?.[id] ? "Configured" : "Missing environment variable"}</small></div>)}</div>
    <div className="setup-steps"><h3>Required environment variables</h3><code>MONDAY_API_TOKEN</code><code>MONDAY_DEALS_BOARD_ID</code><code>MONDAY_WORK_ORDERS_BOARD_ID</code><code>HF_TOKEN</code><p>Configure these in Vercel → Project Settings → Environment Variables, then redeploy.</p></div>
    <div className="modal-actions"><button onClick={onRefresh}><RefreshCw size={16}/> Check again</button><button className="primary" onClick={onClose}>Done</button></div>
  </div></div>;
}
