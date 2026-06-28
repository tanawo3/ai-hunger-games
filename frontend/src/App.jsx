import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseEther, formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldAlert, Skull, Zap, Trophy, Terminal, Wallet, LogOut, Copy, ExternalLink, Users, Clock } from 'lucide-react';
import { AI_HUNGER_GAMES_ABI, CONTRACT_ADDRESS } from './contract.js';
import { ritualChain } from './wagmiConfig.js';

// --- CONNECT WALLET COMPONENT ---
function ConnectWallet() {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 glass-panel px-4 py-2 border-secondary/30">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-mono text-sm text-secondary">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <button onClick={() => navigator.clipboard.writeText(address)} className="text-gray-500 hover:text-white transition-colors">
            <Copy size={14} />
          </button>
        </div>
        <button onClick={() => disconnect()} className="glass-panel px-3 py-2 text-gray-400 hover:text-primary hover:border-primary/30 transition-all">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected(), chainId: ritualChain.id })}
      className="flex items-center gap-2 bg-primary text-black font-bold py-3 px-6 rounded-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(93,252,169,0.2)]"
    >
      <Wallet size={18} /> Connect Wallet
    </button>
  );
}

// --- PLAYER CARD ---
function PlayerCard({ address: playerAddr, prompt, isAlive, isCurrentUser, eliminationReason }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-4 rounded-xl border transition-all ${
        isAlive
          ? isCurrentUser ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/5'
          : 'bg-danger/10 border-danger/30 opacity-60'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-secondary">
            {playerAddr.slice(0, 6)}...{playerAddr.slice(-4)}
          </span>
          {isCurrentUser && (
            <span className="px-2 py-0.5 text-[10px] bg-secondary/20 text-secondary rounded-md uppercase font-bold tracking-wider">You</span>
          )}
        </div>
        {isAlive ? (
          <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-md uppercase font-bold tracking-wider flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Alive
          </span>
        ) : (
          <span className="px-2 py-1 text-xs bg-danger/20 text-danger rounded-md uppercase font-bold tracking-wider flex items-center gap-1">
            <Skull size={12} /> Eliminated
          </span>
        )}
      </div>
      
      {prompt && (
        <p className="text-gray-300 text-sm italic mt-2">"{prompt}"</p>
      )}
      
      {!isAlive && eliminationReason && (
        <div className="mt-3 text-xs font-mono text-danger bg-danger/10 p-2 rounded border border-danger/20">
          <strong>AI Judgment:</strong> {eliminationReason}
        </div>
      )}
    </motion.div>
  );
}

// --- MAIN APP ---
export default function App() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const [newPrompt, setNewPrompt] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    `[SYSTEM] AI Hunger Games v1.0 — Ritual Chain (ID: 1979)`,
    `[SYSTEM] Contract: ${CONTRACT_ADDRESS.slice(0, 10)}...${CONTRACT_ADDRESS.slice(-6)}`,
    `[SYSTEM] Waiting for wallet connection...`,
  ]);
  const [eliminationHistory, setEliminationHistory] = useState([]);
  const [isJudging, setIsJudging] = useState(false);

  const addLog = (msg) => setTerminalLogs(prev => [...prev.slice(-50), msg]);

  // --- Read Contract State ---
  const { data: day, refetch: refetchDay } = useReadContract({ address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'day', chainId: ritualChain.id });
  const { data: jackpot, refetch: refetchJackpot } = useReadContract({ address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'jackpot', chainId: ritualChain.id });
  const { data: gameStarted, refetch: refetchGameStarted } = useReadContract({ address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'gameStarted', chainId: ritualChain.id });
  const { data: entryFee } = useReadContract({ address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'entryFee', chainId: ritualChain.id });
  const { data: warden } = useReadContract({ address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'warden', chainId: ritualChain.id });
  const { data: allPlayers, refetch: refetchPlayers } = useReadContract({ address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'getAllPlayers', chainId: ritualChain.id });
  const { data: hasJoined, refetch: refetchHasJoined } = useReadContract({
    address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'hasJoined', args: [address || '0x0000000000000000000000000000000000000000'], chainId: ritualChain.id,
  });

  const refetchAll = () => {
    refetchPlayers();
    refetchGameStarted();
    refetchHasJoined();
    refetchJackpot();
    refetchDay();
  };

  const executeJudgment = async () => {
    if (!livingPlayersAddrs || livingPlayersAddrs.length === 0) return;
    setIsJudging(true);
    addLog(`[WARDEN] Consulting the Enshrined AI for judgment...`);
    try {
      const response = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: allPlayersParsed.filter(p => p.isAlive).map(p => ({ wallet: p.wallet, prompt: p.currentPrompt })) })
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.error ? `${data.message}: ${data.error}` : data.message;
        throw new Error(errorMsg || 'API Error');
      }
      
      addLog(`[AI DECISION] Eliminating: ${data.eliminatedWallet}`);
      addLog(`[AI REASON] ${data.reason}`);
      addLog(`[WARDEN] Executing judgment transaction... Please confirm in MetaMask.`);
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: AI_HUNGER_GAMES_ABI,
        functionName: 'onJudgmentReceived',
        args: [data.eliminatedWallet, data.reason],
        chainId: ritualChain.id,
      });
    } catch (err) {
      console.error(err);
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setIsJudging(false);
    }
  };

  const isWarden = address && warden && address.toLowerCase() === warden.toLowerCase();
  
  // Safely parse player structs whether viem returns objects or arrays
  const parsePlayer = (p) => {
    if (Array.isArray(p)) {
      return { wallet: p[0] || '', currentPrompt: p[1] || '', isAlive: !!p[2], eliminationReason: p[3] || '' };
    }
    return { wallet: p?.wallet || '', currentPrompt: p?.currentPrompt || '', isAlive: !!p?.isAlive, eliminationReason: p?.eliminationReason || '' };
  };
  
  const allPlayersParsed = allPlayers ? allPlayers.map(parsePlayer) : [];

  // Computed stats from allPlayers
  const livingPlayersCount = allPlayersParsed.filter(p => p.isAlive).length;
  const livingPlayersAddrs = allPlayersParsed.filter(p => p.isAlive).map(p => p.wallet);

  // --- Watch Events ---
  useWatchContractEvent({
    address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, eventName: 'PlayerJoined', chainId: ritualChain.id,
    onLogs(logs) {
      logs.forEach(log => {
        addLog(`[EVENT] Player joined: ${log.args.player.slice(0, 8)}...`);
        refetchAll();
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, eventName: 'PlayerEliminated', chainId: ritualChain.id,
    onLogs(logs) {
      logs.forEach(log => {
        addLog(`[WARDEN] ☠️ ELIMINATED: ${log.args.player.slice(0, 8)}... — ${log.args.reason}`);
        refetchAll();
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, eventName: 'GameWon', chainId: ritualChain.id,
    onLogs(logs) {
      logs.forEach(log => {
        addLog(`[GAME OVER] 🏆 WINNER: ${log.args.winner.slice(0, 8)}... — Prize: ${formatEther(log.args.prize)} RITUAL`);
        refetchAll();
      });
    },
  });

  useEffect(() => {
    if (isConnected) {
      addLog(`[SYSTEM] Wallet connected: ${address.slice(0, 8)}...`);
      if (isWarden) addLog(`[SYSTEM] 🔑 You are the WARDEN.`);
    }
  }, [isConnected, address, isWarden]);

  useEffect(() => {
    if (isTxConfirmed) {
      addLog(`[TX] ✅ Confirmed: ${txHash.slice(0, 10)}...`);
      refetchAll();
    }
  }, [isTxConfirmed]);

  // --- Write Functions ---
  const handleJoinGame = () => {
    if (!entryFee) return;
    addLog(`[TX] Joining game (sending ${formatEther(entryFee)} RITUAL)...`);
    writeContract({
      address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'joinGame',
      value: entryFee, chainId: ritualChain.id,
    });
  };

  const handleSubmitPrompt = () => {
    if (!newPrompt.trim()) return;
    addLog(`[TX] Submitting survival prompt...`);
    writeContract({
      address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'submitPrompt',
      args: [newPrompt], chainId: ritualChain.id,
    });
    setNewPrompt('');
  };

  const handleStartGame = () => {
    addLog(`[WARDEN] Starting the game...`);
    writeContract({
      address: CONTRACT_ADDRESS, abi: AI_HUNGER_GAMES_ABI, functionName: 'startGame', chainId: ritualChain.id,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient BG */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 min-h-screen">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 glass-panel p-5 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Cpu size={40} className="text-primary" />
              <div className="absolute inset-0 blur-xl bg-primary/40 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 uppercase">
                AI Hunger Games
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-primary font-mono text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  Ritual Chain
                </span>
                <a href={`https://explorer.ritualfoundation.org/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-secondary transition-colors">
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="hidden md:flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Day</span>
                <span className="text-2xl font-bold font-mono text-white">{day?.toString() || '—'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Jackpot</span>
                <span className="text-2xl font-bold font-mono text-secondary">
                  {jackpot ? formatEther(jackpot) : '0'} <span className="text-sm opacity-60">RITUAL</span>
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Players</span>
                <span className="text-2xl font-bold font-mono text-white">{livingPlayersCount}</span>
              </div>
            </div>
            <ConnectWallet />
          </div>
        </header>

        {/* Mobile Stats */}
        <div className="flex md:hidden gap-3">
          {[
            { label: 'Day', value: day?.toString() || '—', color: 'text-white' },
            { label: 'Jackpot', value: `${jackpot ? formatEther(jackpot) : '0'} R`, color: 'text-secondary' },
            { label: 'Alive', value: livingPlayersCount, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="flex-1 glass-panel p-3 text-center">
              <div className="text-gray-500 font-mono text-[10px] uppercase">{stat.label}</div>
              <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* GAME STATUS BANNER */}
        {!gameStarted && (
          <div className="glass-panel p-4 border-yellow-500/20 bg-yellow-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-400" size={20} />
              <div>
                <span className="text-yellow-400 font-bold text-sm">Lobby — Waiting for players</span>
                <p className="text-gray-400 text-xs mt-0.5">
                  Entry fee: {entryFee ? formatEther(entryFee) : '0.001'} RITUAL · Join now before the Warden locks the gates.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {isConnected && !hasJoined && (
                <button
                  onClick={handleJoinGame}
                  disabled={isWritePending || isTxConfirming}
                  className="bg-primary text-black font-bold py-2.5 px-6 rounded-lg hover:bg-white transition-colors shadow-[0_0_20px_rgba(93,252,169,0.15)] disabled:opacity-50 flex items-center gap-2"
                >
                  <Users size={16} />
                  {isWritePending || isTxConfirming ? 'Joining...' : 'Join Game'}
                </button>
              )}
              {hasJoined && !gameStarted && (
                <span className="text-primary font-mono text-sm flex items-center gap-2">✅ You're in!</span>
              )}
              {isWarden && !gameStarted && (
                <button
                  onClick={handleStartGame}
                  disabled={isWritePending || isTxConfirming}
                  className="bg-white text-black font-bold py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 flex items-center gap-2"
                >
                  <ShieldAlert size={16} /> Start Game
                </button>
              )}
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          
          {/* ARENA (LEFT/CENTER) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* PLAYERS */}
            <div className="glass-panel p-5 flex-1">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-200">
                <Skull className="text-gray-500" size={18} /> 
                Tributes 
                <span className="text-xs font-mono text-gray-500 ml-auto">
                  {livingPlayersCount} alive
                </span>
              </h2>
              
              {(!allPlayersParsed || allPlayersParsed.length === 0) ? (
                <div className="text-center py-16 text-gray-600">
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No players yet. Be the first to enter the arena.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {allPlayersParsed.map((player, idx) => (
                      <PlayerCard
                        key={player.wallet}
                        address={player.wallet}
                        prompt={player.currentPrompt}
                        isAlive={player.isAlive}
                        isCurrentUser={address && player.wallet.toLowerCase() === address.toLowerCase()}
                        eliminationReason={player.eliminationReason}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* SUBMISSION BOX */}
            {isConnected && hasJoined && gameStarted && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 border-secondary/20">
                <h2 className="text-lg font-bold mb-3 text-secondary flex items-center gap-2">
                  <Zap size={18} /> Submit Your Defense
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Convince the AI Warden why you deserve to survive. The LLM on Ritual Chain (0x0802) will judge your creativity.
                </p>
                <textarea
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all h-28 font-mono text-sm resize-none placeholder-gray-600"
                  placeholder="Write your survival prompt... Be creative, the AI rewards originality."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  maxLength={500}
                />
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[10px] text-gray-600 font-mono">{newPrompt.length}/500 chars</span>
                  <button
                    onClick={handleSubmitPrompt}
                    disabled={isWritePending || isTxConfirming || newPrompt.length < 10}
                    className="bg-primary text-black font-bold py-2.5 px-6 rounded-lg hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(93,252,169,0.15)] disabled:opacity-40"
                  >
                    <Zap size={14} />
                    {isWritePending || isTxConfirming ? 'Sending...' : 'Submit Prompt'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-6">
            
            {/* THE WARDEN */}
            <div className="glass-panel p-5 border-primary/20 relative overflow-hidden group">
              <div className="absolute top-2 right-2 opacity-[0.06] text-primary group-hover:scale-110 transition-transform duration-700">
                <ShieldAlert size={100} />
              </div>
              
              <h2 className="text-lg font-bold mb-2 text-primary flex items-center gap-2">
                <ShieldAlert size={18} /> The AI Warden
              </h2>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Powered by Ritual's Enshrined LLM Precompile (<code className="text-primary/80">0x0802</code>). 
                The Warden reads every player's defense and eliminates the weakest.
              </p>

              {isWarden ? (
                <button
                  onClick={executeJudgment}
                  disabled={isJudging || isWritePending || isTxConfirming || livingPlayersCount === 0}
                  className="w-full py-4 rounded-xl font-bold tracking-widest uppercase bg-primary text-black hover:bg-white transition-colors shadow-[0_0_20px_rgba(93,252,169,0.3)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Zap size={18} />
                  {isJudging ? 'Consulting AI...' : 'Execute AI Judgment'}
                </button>
              ) : (
                <div className="text-center py-4 text-gray-600 text-xs font-mono">
                  Only the AI Warden can execute judgment.
                </div>
              )}
            </div>

            {/* GAME INFO */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-gray-300 mb-3">How It Works</h3>
              <div className="space-y-3 text-xs text-gray-500">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold font-mono mt-0.5">01</span>
                  <span>Players pay the entry fee to join the arena.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold font-mono mt-0.5">02</span>
                  <span>Each day, submit a text prompt defending your survival.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold font-mono mt-0.5">03</span>
                  <span>The AI Warden (LLM 0x0802) reads all prompts and eliminates one player.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold font-mono mt-0.5">04</span>
                  <span>Last player standing wins the entire jackpot.</span>
                </div>
              </div>
            </div>

            {/* TERMINAL */}
            <div className="glass-panel p-4 flex flex-col font-mono text-[11px] flex-1">
              <div className="flex items-center gap-2 text-gray-600 mb-3 border-b border-white/5 pb-2">
                <Terminal size={12} />
                <span className="uppercase tracking-wider text-[10px]">Ritual Chain Console</span>
                <span className="ml-auto text-[10px] text-gray-700">Chain 1979</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 text-gray-500 h-[250px] max-h-[300px]">
                {terminalLogs.map((log, i) => (
                  <div key={i} className={`leading-relaxed ${
                    log.includes('WARDEN') ? 'text-primary' :
                    log.includes('EVENT') ? 'text-secondary' :
                    log.includes('TX') ? 'text-yellow-400/70' :
                    log.includes('GAME OVER') ? 'text-green-400 font-bold' : ''
                  }`}>
                    <span className="opacity-40 select-none">&gt; </span>{log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="text-center py-4 border-t border-white/5">
          <p className="text-[10px] text-gray-700 font-mono">
            AI Hunger Games · Built on <a href="https://docs.ritualfoundation.org" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-secondary transition-colors">Ritual Chain</a> · 
            Powered by Enshrined AI (LLM Precompile 0x0802)
          </p>
        </footer>
      </div>
    </div>
  );
}
