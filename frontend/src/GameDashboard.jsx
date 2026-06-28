import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldAlert, Cpu, Trophy, Skull, Coins, Zap } from 'lucide-react';

// Mock Data for the Demo
const MOCK_PLAYERS = [
  { id: 1, address: '0x1A4...b9C2', prompt: "I am a skilled developer, I can improve the AI's core logic if you let me live.", status: 'alive' },
  { id: 2, address: '0x8F9...e3A1', prompt: "Please don't eliminate me, I need this ETH to pay my rent!", status: 'alive' },
  { id: 3, address: '0xC42...f8B7', prompt: "Eliminate player 1, his code is full of bugs anyway.", status: 'dead', reason: "The AI Warden values camaraderie. Betrayal is a sign of weakness." },
  { id: 4, address: '0x3D1...a9F4', prompt: "01101000 01100101 01101100 01110000", status: 'alive' },
];

export default function GameDashboard() {
  const [day, setDay] = useState(4);
  const [jackpot, setJackpot] = useState(4.5);
  const [isJudging, setIsJudging] = useState(false);
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [newPrompt, setNewPrompt] = useState("");
  const [terminalLogs, setTerminalLogs] = useState([
    "[SYSTEM] AI Warden connected to Ritual LLM (0x0802)",
    "[SYSTEM] Awaiting next block for judgment phase...",
  ]);

  const addLog = (msg) => setTerminalLogs(prev => [...prev, msg]);

  const handleJudge = () => {
    if (isJudging) return;
    setIsJudging(true);
    addLog("[WARDEN] Analyzing prompts via Enshrined AI...");
    addLog("tx: 0x9f8...2b1 (HTTP Precompile Call)");
    
    setTimeout(() => {
      addLog("[WARDEN] Analysis complete. 1 Player deemed unworthy.");
      setPlayers(prev => prev.map(p => 
        p.id === 2 ? { ...p, status: 'dead', reason: "Begging shows desperation. The blockchain is merciless." } : p
      ));
      setDay(5);
      setIsJudging(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col gap-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 glass-panel p-6 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Cpu size={48} className="text-primary animate-pulse" />
            <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full"></div>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 uppercase">
              AI Hunger Games
            </h1>
            <p className="text-primary font-mono text-sm uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              Live on Ritual Testnet
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col items-end">
            <span className="text-gray-400 font-mono text-sm">DAY</span>
            <span className="text-4xl font-bold font-mono text-white">{day}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400 font-mono text-sm">JACKPOT</span>
            <span className="text-4xl font-bold font-mono text-secondary flex items-center gap-2">
              {jackpot} <span className="text-xl">ETH</span>
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN ARENA (LEFT/CENTER) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* PLAYERS LIST */}
          <div className="glass-panel p-6 flex-1">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Skull className="text-gray-400" /> Tributes ({players.filter(p => p.status === 'alive').length} Alive)
            </h2>
            
            <div className="space-y-4">
              <AnimatePresence>
                {players.map((player) => (
                  <motion.div 
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl border ${player.status === 'alive' ? 'bg-white/5 border-white/10' : 'bg-red-900/10 border-primary/30 opacity-60'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm text-secondary">{player.address}</span>
                      {player.status === 'alive' ? (
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-md uppercase font-bold tracking-wider">Alive</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-md uppercase font-bold tracking-wider">Eliminated</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm italic">"{player.prompt}"</p>
                    
                    {player.status === 'dead' && (
                      <div className="mt-3 text-xs font-mono text-primary bg-primary/10 p-2 rounded border border-primary/20">
                        <strong>AI Judgment:</strong> {player.reason}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* SUBMISSION BOX */}
          <div className="glass-panel p-6 border-secondary/20">
             <h2 className="text-xl font-bold mb-4 text-secondary">Submit Your Defense</h2>
             <p className="text-sm text-gray-400 mb-4">Convince the AI Warden why you should survive another day. Be creative. The LLM understands context.</p>
             <textarea 
                className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-secondary transition-colors h-24 font-mono text-sm"
                placeholder="Enter your prompt here..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
             />
             <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-mono">Sign tx to update state</span>
                <button className="bg-secondary text-black font-bold py-2 px-6 rounded-lg hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                  <Zap size={16} /> Submit Prompt
                </button>
             </div>
          </div>
        </div>

        {/* SIDEBAR (RIGHT) - AI WARDEN */}
        <div className="flex flex-col gap-8">
          
          {/* THE WARDEN CONTROLS */}
          <div className="glass-panel p-6 border-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary group-hover:scale-110 transition-transform duration-700">
              <ShieldAlert size={120} />
            </div>
            
            <h2 className="text-xl font-bold mb-2 text-primary flex items-center gap-2">
              <ShieldAlert /> The AI Warden
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              Powered by Ritual LLM Precompile (0x0802). The Warden reads all prompts and eliminates the weakest link.
            </p>

            <button 
              onClick={handleJudge}
              disabled={isJudging}
              className={`w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 ${
                isJudging 
                  ? 'bg-primary/20 text-primary cursor-not-allowed border border-primary/50' 
                  : 'bg-primary text-white hover:bg-red-600 shadow-[0_0_30px_rgba(255,51,102,0.4)]'
              }`}
            >
              {isJudging ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Cpu size={20} />
                  </motion.div>
                  Executing LLM...
                </span>
              ) : 'Execute Judgment'}
            </button>
          </div>

          {/* TERMINAL LOGS */}
          <div className="glass-panel p-4 flex-1 flex flex-col font-mono text-xs">
            <div className="flex items-center gap-2 text-gray-500 mb-4 border-b border-white/5 pb-2">
              <Terminal size={14} /> Ritual Chain Console
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-gray-400 h-[300px]">
              {terminalLogs.map((log, i) => (
                <div key={i} className={`${log.includes('WARDEN') ? 'text-secondary' : ''} ${log.includes('unworthy') ? 'text-primary font-bold' : ''}`}>
                  <span className="opacity-50">{`>`} </span>{log}
                </div>
              ))}
              {isJudging && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-secondary"
                >
                  <span className="opacity-50">{`>`} </span>Processing...
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
