import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LayoutGrid, Server, Activity, Shield, Settings, Bell, Search, Sun, Moon, Globe, ChevronDown,
    Zap, Share2, AlertCircle, CheckCircle2, MoreVertical, Filter, Plus, X, BookOpen, Info, ShieldAlert, Cpu, GitBranch, Save, RefreshCw, Layers, Database, Lock, Network, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CP_URL = 'http://localhost:5000/api';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(true);
    useEffect(() => { document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); }, [isDark]);
    return (
        <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
        </button>
    );
};

function App() {
    const [activeTab, setActiveTab] = useState('topology');
    const [isNoviceMode, setIsNoviceMode] = useState(false);
    const [services, setServices] = useState([]);

    const [isSending, setIsSending] = useState(false);
    const [lastRequestResult, setLastRequestResult] = useState(null);
    const [breakerState, setBreakerState] = useState('CLOSED');

    const [circuitBreakers, setCircuitBreakers] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [cbForm, setCbForm] = useState({ serviceName: 'service-b', failureThreshold: 3, cooldownPeriod: 10000, requestTimeout: 5000 });
    const [isUpdatingCB, setIsUpdatingCB] = useState(false);

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [regForm, setRegForm] = useState({ name: '', url: '', version: 'v1.0.0' });

    const fetchData = async () => {
        try {
            const res = await axios.get(`${CP_URL}/registry`);
            setServices(res.data);
            const svcB = res.data.find(s => s.name === 'service-b');
            if (svcB) {
                if (svcB.status === 'OPEN') setBreakerState('OPEN');
                else if (svcB.status === 'HALF_OPEN') setBreakerState('COOLDOWN');
                else setBreakerState('CLOSED');
            }
        } catch (err) { console.error(err); }
    };

    const fetchSecurityData = async () => {
        try {
            const [cbRes, polRes] = await Promise.all([
                axios.get(`${CP_URL}/breaker`),
                axios.get(`${CP_URL}/policies`)
            ]);
            setCircuitBreakers(cbRes.data);
            setPolicies(polRes.data);
            if (cbRes.data.length > 0) {
                const b = cbRes.data.find(x => x.serviceName === 'service-b') || cbRes.data[0];
                setCbForm(prev => ({ ...prev, failureThreshold: b.failureThreshold, cooldownPeriod: b.cooldownPeriod, requestTimeout: b.requestTimeout }));
            }
        } catch (err) { console.error('Error fetching security data', err); }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 1500);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => { if (activeTab === 'policies') fetchSecurityData(); }, [activeTab]);

    const sendTestRequest = async () => {
        if (isSending) return;
        setIsSending(true);
        setLastRequestResult(null);
        try {
            const res = await axios.get('http://localhost:3001/trace');
            setLastRequestResult('success');
        } catch (err) {
            if (err.response?.status === 503 && err.response?.data?.error?.includes('Circuit Breaker OPEN')) {
                setLastRequestResult('fast-fail');
            } else { setLastRequestResult('error'); }
        } finally { setTimeout(() => { setIsSending(false); }, 1500); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${CP_URL}/registry/register`, regForm);
            setShowRegisterModal(false);
            setRegForm({ name: '', url: '', version: 'v1.0.0' });
            fetchData();
        } catch (err) { alert('Registration failed: ' + (err.response?.data?.error || err.message)); }
    };

    const handleUpdateCB = async (e) => {
        e.preventDefault();
        setIsUpdatingCB(true);
        try {
            await axios.post(`${CP_URL}/breaker`, cbForm);
            fetchSecurityData();
        } catch (err) { alert('Update failed: ' + (err.response?.data?.error || err.message)); }
        finally { setIsUpdatingCB(false); }
    };

    const getBreakerColors = () => {
        if (breakerState === 'CLOSED') return { line: 'bg-green-500', dropShadow: 'shadow-green-500', glow: 'text-green-400', border: 'border-green-500' };
        if (breakerState === 'OPEN') return { line: 'bg-red-500', dropShadow: 'shadow-red-500', glow: 'text-red-400', border: 'border-red-500' };
        if (breakerState === 'COOLDOWN') return { line: 'bg-yellow-500', dropShadow: 'shadow-yellow-500', glow: 'text-yellow-400', border: 'border-yellow-500' };
        return { line: 'bg-slate-500', dropShadow: 'shadow-slate-500', glow: 'text-slate-400', border: 'border-slate-500/40' };
    };
    const c = getBreakerColors();

    return (
        <div className="flex bg-[#020617] text-slate-200 font-sans min-h-screen overflow-x-hidden">
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#050914] border-r border-white/5 flex flex-col z-30 shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px]"></div>
                <div className="pt-12 pb-4 flex items-center px-6 gap-3 border-b border-white/5 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Activity className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">IstioDash</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 relative z-10">
                    {[{ id: 'overview', icon: LayoutGrid, label: 'Overview' }, { id: 'topology', icon: Share2, label: 'Topology Hub' }, { id: 'services', icon: Server, label: 'Services' }, { id: 'policies', icon: Shield, label: 'Security' }, { id: 'settings', icon: Settings, label: 'Settings' }].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${activeTab === item.id ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}>
                            {activeTab === item.id && <motion.div layoutId="active-tab" className="absolute left-0 w-1 h-full bg-blue-500 rounded-r-full" />}
                            <item.icon size={20} className={activeTab === item.id ? 'text-blue-400' : 'group-hover:text-blue-400 transition-colors'} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 ml-64 flex flex-col relative min-h-screen">
                <header className="fixed top-0 right-0 left-64 pt-8 px-8 z-20 pointer-events-none">
                    <div className="h-16 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-between px-6 shadow-2xl relative overflow-hidden pointer-events-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold cursor-pointer hover:bg-white/10 transition shadow-inner">
                                <Globe size={14} className="text-blue-400" /><span>prod-us-east-1</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 relative z-10">
                            <button onClick={() => setIsNoviceMode(!isNoviceMode)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-xl border ${isNoviceMode ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/50 ring-2 ring-indigo-500/30' : 'bg-[#0b1120] text-slate-400 border-white/10 hover:text-slate-200 hover:bg-slate-800'}`}>
                                <BookOpen size={16} className={isNoviceMode ? 'text-indigo-400' : ''} />
                                {isNoviceMode ? 'Tutorial Mode Active' : 'Novice Tutorial'}
                            </button>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div className="flex-1 relative bg-[#020617] p-6 pt-32 min-h-screen pb-20">
                    <AnimatePresence>
                        {isNoviceMode && activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute z-50 top-32 right-12 w-80 bg-[#1e1b4b]/95 backdrop-blur-md border-l-4 border-indigo-500 rounded-lg p-5 shadow-2xl">
                                <div className="flex gap-3 items-center mb-3 text-indigo-300 font-bold border-b border-indigo-500/30 pb-2"><Info size={18}/> Overview Dashboard</div>
                                <p className="text-sm text-indigo-200 leading-relaxed mb-3">Welcome to your centralized <strong>Control Plane</strong>. It monitors the health of all microservices registered in your system.</p>
                            </motion.div>
                        )}
                        {isNoviceMode && activeTab === 'topology' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute z-50 top-32 right-12 w-80 bg-[#1e1b4b]/95 backdrop-blur-md border-l-4 border-indigo-500 rounded-lg p-5 shadow-2xl">
                                <div className="flex gap-3 items-center mb-3 text-indigo-300 font-bold border-b border-indigo-500/30 pb-2"><Info size={18}/> The Circuit Breaker</div>
                                <p className="text-sm text-indigo-200 leading-relaxed mb-3">Notice the physical switch in the middle? That's the <strong>Circuit Breaker</strong>.</p>
                                <p className="text-sm text-indigo-200 leading-relaxed mb-3">When you click <strong>Fire Traffic Trace</strong>, you send requests to a service that fails 30% of the time.</p>
                                <p className="text-sm text-indigo-200 leading-relaxed">If it fails multiple times in a row, the switch physically OPENS and cuts off the wire! This protects the failing service by rejecting requests instantly.</p>
                            </motion.div>
                        )}
                        {isNoviceMode && activeTab === 'policies' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute z-50 top-32 right-12 w-[350px] bg-[#1e1b4b]/95 backdrop-blur-md border-l-4 border-indigo-500 rounded-lg p-5 shadow-2xl">
                                <div className="flex gap-3 items-center mb-3 text-indigo-300 font-bold border-b border-indigo-500/30 pb-2"><ShieldAlert size={18}/> Live Configuration</div>
                                <p className="text-sm text-indigo-200 leading-relaxed mb-3">You can tweak the exact limits of the Circuit Breaker here.</p>
                                <p className="text-sm text-indigo-200 leading-relaxed">Try changing the Failure Threshold (Strikes) to 1. Then go back to the Topology Hub and fire a trace. The breaker will trip on the very first failure!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === 'overview' && (
                        <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Mesh Services', value: services.length, icon: Server, color: 'blue' },
                                    { label: 'Network Traffic', value: '2.4k', sub: 'RPS', icon: Activity, color: 'indigo' },
                                    { label: 'Avg Latency', value: '14ms', icon: Zap, color: 'amber' },
                                    { label: 'Error Rate', value: '0.04%', icon: AlertCircle, color: 'rose' }
                                ].map((stat, i) => (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className={`relative overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#0b1120] p-6 rounded-3xl border shadow-xl transition-colors group border-${stat.color}-500/20 hover:border-${stat.color}-500/50`}>
                                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 flex items-center justify-center mb-4 border border-${stat.color}-500/20 shadow-inner group-hover:scale-110 transition-transform`}><stat.icon size={24} /></div>
                                        <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</div>
                                        <div className="text-3xl font-black text-white flex items-end gap-1">{stat.value} <span className="text-sm font-bold text-slate-500 mb-1">{stat.sub}</span></div>
                                    </motion.div>
                                ))}
                            </div>
                            
                            <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner"><Server size={20} /></div>
                                        <div><h3 className="text-lg font-bold text-white">Live Service Registry</h3><p className="text-xs text-slate-400">Microservices auto-discovered by the Control Plane</p></div>
                                    </div>
                                    <button onClick={() => setShowRegisterModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25 active:scale-95"><Plus size={16} /> Register Workload</button>
                                </div>
                                <div className="p-6">
                                    <div className="grid gap-4">
                                        {services.map((svc, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center text-blue-400 font-black text-xl shadow-inner">{svc.name.charAt(0).toUpperCase()}</div>
                                                    <div>
                                                        <div className="font-bold text-slate-200">{svc.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">sidecar-proxy-{svc.name}-4x</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-sm text-slate-400 font-mono flex items-center gap-2"><Lock size={14} className="text-blue-500 opacity-50"/> default-namespace</div>
                                                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-inner ${svc.status === 'UP' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : svc.status === 'OPEN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}><span className={`w-2 h-2 rounded-full ${svc.status === 'UP' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></span>{svc.status}</span>
                                                    <button className="p-2 rounded-xl border border-white/5 hover:bg-slate-800 text-slate-400 transition-colors"><MoreVertical size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'topology' && (
                        <div className="h-full w-full flex flex-col items-center justify-center relative animate-fade-in mt-10">
                            <div className="text-center mb-16 relative z-10">
                                <h1 className="text-4xl font-black tracking-tight text-white mb-3">Service Mesh Circuit Breaker</h1>
                                <p className="text-slate-400 max-w-xl mx-auto text-sm">Watch real-time traffic flow through the sidecar proxies. The Circuit Breaker protects the failing service by mechanically snapping open and blocking traffic.</p>
                            </div>

                            <div className="relative w-full max-w-5xl flex items-center justify-between px-10">
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${breakerState === 'CLOSED' ? 'from-transparent via-green-600 to-transparent' : breakerState === 'OPEN' ? 'from-transparent via-red-600 to-transparent' : 'from-transparent via-yellow-600 to-transparent'}`}></div>

                                {/* Service A */}
                                <div className="flex flex-col items-center relative z-10 w-48">
                                    <div className="bg-[#0f172a] rounded-3xl p-1 shadow-2xl border border-blue-500/20 mb-4 w-full relative group">
                                        <div className="bg-gradient-to-b from-[#162032] to-[#0b1120] rounded-2xl p-6 text-center shadow-inner relative z-10">
                                            <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_#3b82f640]"><Server size={24}/></div>
                                            <h3 className="font-bold text-blue-100">Service A</h3>
                                            <p className="text-[10px] text-blue-400 capitalize mt-1 font-mono tracking-widest">Caller</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#1e293b] border-2 border-indigo-500/40 rounded-xl p-3 flex items-center gap-3 w-40 justify-center shadow-lg relative glow-indigo">
                                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_10px_#6366f1]"><Network size={12} className="text-white"/></div>
                                        <Shield className="text-indigo-400" size={18}/>
                                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Sidecar A</span>
                                    </div>
                                    <div className="absolute top-[85%] right-[-100px] h-[2px] w-[100px] bg-indigo-500/50"></div>
                                </div>

                                {/* The Circuit Breaker Switch */}
                                <div className="flex-1 flex justify-center items-center relative h-32 px-4 z-0">
                                    <div className="h-[4px] bg-slate-800 flex-1 relative rounded-l-full overflow-hidden">
                                        <div className="absolute inset-0 bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                                    </div>

                                    <div className={`mx-2 relative flex flex-col items-center justify-center transition-all duration-500 p-4 rounded-2xl border-[3px] shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md ${breakerState === 'OPEN' ? 'bg-red-900/10' : breakerState === 'CLOSED' ? 'bg-green-900/10' : 'bg-yellow-900/10'} ${c.border} ${c.dropShadow}`}>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-300 mb-2">Circuit Breaker</div>
                                        <div className="w-24 h-12 relative flex items-center justify-center">
                                            <div className="w-3 h-3 rounded-full bg-slate-500 absolute left-0 z-10 shadow-inner"></div>
                                            <div className="w-3 h-3 rounded-full bg-slate-500 absolute right-0 z-10 shadow-inner"></div>
                                            <motion.div 
                                                className={`h-[4px] rounded-full absolute left-1.5 origin-left ${c.line}`}
                                                style={{ width: '80px' }}
                                                animate={{ rotate: breakerState === 'CLOSED' ? 0 : breakerState === 'OPEN' ? -45 : -20 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            />
                                        </div>
                                        <div className={`mt-2 font-black tracking-widest text-lg uppercase ${c.glow} drop-shadow-[0_0_10px_currentColor]`}>{breakerState}</div>
                                    </div>

                                    <div className="h-[4px] bg-slate-800 flex-1 relative rounded-r-full overflow-hidden">
                                        <div className={`absolute inset-0 transition-all duration-300 ${breakerState === 'CLOSED' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : breakerState === 'COOLDOWN' ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-slate-800'}`}></div>
                                    </div>

                                    <AnimatePresence>
                                        {isSending && (
                                            <motion.div
                                                initial={{ left: "0%", opacity: 1, scale: 0.5 }}
                                                animate={{
                                                    left: lastRequestResult === 'fast-fail' ? ["0%", "45%", "0%"] : ["0%", "100%"],
                                                    opacity: [1, 1, 0],
                                                    scale: [1, 1.5, 1]
                                                }}
                                                transition={{ duration: lastRequestResult === 'fast-fail' ? 0.6 : 1.2, ease: "easeInOut" }}
                                                className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-50 shadow-[0_0_20px_2px_currentColor]
                                                    ${!lastRequestResult ? 'bg-blue-400 text-blue-400' : lastRequestResult === 'success' ? 'bg-green-400 text-green-400' : 'bg-red-500 text-red-500'}`}
                                            >
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Service B */}
                                <div className="flex flex-col items-center relative z-10 w-48">
                                    <div className={`absolute top-[85%] left-[-100px] h-[2px] w-[100px] ${breakerState === 'CLOSED' ? 'bg-green-500/50' : breakerState === 'COOLDOWN' ? 'bg-yellow-500/50' : 'bg-slate-800'}`}></div>
                                    <div className={`bg-[#1e293b] border-2 rounded-xl p-3 flex items-center gap-3 w-40 justify-center shadow-lg relative z-20 mb-4 transition-colors ${breakerState === 'CLOSED' ? 'border-green-500/40 glow-green' : breakerState === 'COOLDOWN' ? 'border-yellow-500/40 glow-yellow' : 'border-slate-700 opacity-60'}`}>
                                        <div className={`absolute -bottom-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_10px_currentColor] ${breakerState === 'CLOSED' ? 'bg-green-500' : breakerState === 'COOLDOWN' ? 'bg-yellow-500' : 'bg-slate-600'}`}><Network size={12} className="text-white"/></div>
                                        <Shield className={`${breakerState === 'CLOSED' ? 'text-green-400' : breakerState === 'COOLDOWN' ? 'text-yellow-400' : 'text-slate-400'}`} size={18}/>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${breakerState === 'CLOSED' ? 'text-green-100' : breakerState === 'COOLDOWN' ? 'text-yellow-100' : 'text-slate-500'}`}>Sidecar B</span>
                                    </div>
                                    <div className={`bg-[#0f172a] rounded-3xl p-1 shadow-2xl transition-all duration-500 border w-full relative z-10 ${breakerState === 'CLOSED' ? 'border-green-500/50 shadow-[0_0_20px_#22c55e20]' : breakerState === 'OPEN' ? 'border-red-500/50 shadow-[0_0_20px_#ef444420]' : 'border-yellow-500/50 shadow-[0_0_20px_#eab30820]'}`}>
                                        <div className="bg-gradient-to-b from-[#162032] to-[#0b1120] rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
                                            {breakerState === 'OPEN' && <div className="absolute inset-0 bg-red-500/10 animate-pulse mix-blend-overlay"></div>}
                                            <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 border transition-colors ${breakerState === 'CLOSED' ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_#22c55e40]' : breakerState === 'OPEN' ? 'bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_15px_#ef444440]' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-[0_0_15px_#eab30840]'}`}>
                                                <Server size={24}/>
                                            </div>
                                            <h3 className={`font-bold transition-colors ${breakerState === 'CLOSED' ? 'text-green-100' : breakerState === 'OPEN' ? 'text-red-100' : 'text-yellow-100'}`}>Service B</h3>
                                            <p className={`text-[10px] capitalize mt-1 font-mono tracking-widest ${breakerState === 'CLOSED' ? 'text-green-400' : breakerState === 'OPEN' ? 'text-red-400' : 'text-yellow-400'}`}>Target (Fails 30%)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-20">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative group">
                                    <div className={`absolute -inset-1 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 ${isSending ? 'bg-slate-600' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'}`}></div>
                                    <button onClick={sendTestRequest} disabled={isSending} className="relative bg-[#020617] px-12 py-5 rounded-full ring-1 ring-white/10 flex items-center gap-4 border border-[#1e293b]">
                                        <motion.div animate={isSending ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className={`flex items-center justify-center ${isSending ? 'text-slate-400' : 'text-blue-400'}`}>
                                            <Zap size={24} className={isSending ? 'fill-transparent' : 'fill-blue-500/20'} />
                                        </motion.div>
                                        <div className="text-left">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Control Plane Demo</div>
                                            <div className="text-sm font-bold text-white tracking-widest uppercase">{isSending ? 'Transmitting Trace...' : 'Fire Traffic Trace'}</div>
                                        </div>
                                        <ArrowRight size={20} className="text-slate-500 ml-4 group-hover:text-white transition-colors"/>
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* SERVICES TAB */}
                    {activeTab === 'services' && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-white"><Server className="text-blue-500"/> Service Catalog</h2>
                            <p className="text-slate-400 text-sm mb-6 max-w-2xl">This catalog pulls live data from the Control Plane registry. Each microservice registers its endpoints and version numbers here so other services know how to discover them without hardcoding IPs.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {services.map((svc, i) => (
                                    <div key={i} className="bg-gradient-to-br from-[#0f172a] to-[#0b1120] p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all flex flex-col gap-4 shadow-xl">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-[#020617]/50 rounded-2xl flex items-center justify-center text-2xl text-blue-400 font-black shadow-inner border border-white/5">{svc.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{svc.name}</h3>
                                                    <div className="text-xs text-slate-500 font-mono mt-1">{svc.url}</div>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-inner border ${svc.status === 'UP' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{svc.status}</span>
                                        </div>
                                        <div className="bg-[#020617]/40 p-5 rounded-2xl text-xs space-y-3 mt-2 border border-white/5 shadow-inner">
                                            <div className="flex justify-between"><span className="text-slate-500">Version</span><span className="font-mono text-slate-300 font-bold">{svc.version || 'v1.0.0'}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">Last Ping</span><span className="font-mono text-slate-300">{new Date(svc.lastPing).toLocaleTimeString() || 'N/A'}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">Sidecar Active</span><span className="font-mono text-green-400">Yes (Port 400x)</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* POLICIES TAB */}
                    {activeTab === 'policies' && (
                        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-white"><Shield className="text-indigo-500"/> Circuit Breaker Rule</h2>
                                <p className="text-slate-400 text-sm mb-6">Dynamically change how your Mesh handles failing endpoints. The Watcher Service will push these changes to all Sidecars immediately without starting any pods.</p>
                                
                                <form onSubmit={handleUpdateCB} className="bg-gradient-to-br from-[#0f172a] to-[#0b1120] p-8 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Target Service</label>
                                        <select value={cbForm.serviceName} onChange={e => setCbForm({...cbForm, serviceName: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold">
                                            <option value="service-a">service-a</option><option value="service-b">service-b</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Failure Threshold (Strikes)</label>
                                        <input type="number" min="1" max="10" value={cbForm.failureThreshold} onChange={e => setCbForm({...cbForm, failureThreshold: parseInt(e.target.value)})} className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Cooldown Period (ms)</label>
                                        <input type="number" step="1000" value={cbForm.cooldownPeriod} onChange={e => setCbForm({...cbForm, cooldownPeriod: parseInt(e.target.value)})} className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-bold" />
                                    </div>
                                    <button type="submit" disabled={isUpdatingCB} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-95">
                                        <RefreshCw size={16} className={isUpdatingCB ? "animate-spin" : ""} />
                                        {isUpdatingCB ? 'Pushing Config...' : 'Apply & Push Config to Sidecars'}
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-white"><GitBranch className="text-cyan-500"/> Core Routing Policies</h2>
                                <p className="text-slate-400 text-sm mb-6">Traffic splitting rules committed to Git for auditability.</p>
                                <div className="space-y-4">
                                    {policies.length > 0 ? policies.map((pol, i) => (
                                        <div key={i} className="bg-gradient-to-br from-[#0f172a] to-[#0b1120] p-6 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-xl">
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-blue-200">{pol.sourceService}</span> <GitBranch size={16} className="text-cyan-500"/> <span className="text-blue-200">{pol.targetService}</span>
                                            </div>
                                            <div className="w-full bg-[#020617] rounded-full h-3 border border-white/5 shadow-inner p-0.5">
                                                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full shadow-[0_0_10px_#06b6d4]" style={{ width: `${(pol.weight / 100) * 100}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500 font-mono"><span>Traffic Configured Weight:</span> <span className="text-cyan-400 font-black text-sm">{pol.weight}%</span></div>
                                        </div>
                                    )) : <div className="p-8 bg-[#0f172a] rounded-3xl text-center text-slate-500 text-sm border border-white/5">No routing policies found in Git repo.</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-white"><Layers className="text-pink-500"/> Architecture Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-indigo-500/20 p-8 rounded-[2rem] relative overflow-hidden group shadow-xl hover:border-indigo-500/40 transition-colors">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full"></div>
                                    <Database className="text-indigo-400 mb-6 drop-shadow-[0_0_15px_#818cf8]" size={40}/>
                                    <h3 className="text-xl font-black text-indigo-100 mb-3">The Control Plane</h3>
                                    <p className="text-sm text-indigo-200/80 leading-relaxed font-medium">Runs centrally to coordinate everything. It stores the Service Registry and Configuration Policies. Think of it like air traffic control.</p>
                                </div>
                                <div className="bg-gradient-to-br from-cyan-900/30 to-slate-900 border border-cyan-500/20 p-8 rounded-[2rem] relative overflow-hidden group shadow-xl hover:border-cyan-500/40 transition-colors">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>
                                    <RefreshCw className="text-cyan-400 mb-6 drop-shadow-[0_0_15px_#22d3ee]" size={40}/>
                                    <h3 className="text-xl font-black text-cyan-100 mb-3">The Watcher Service</h3>
                                    <p className="text-sm text-cyan-200/80 leading-relaxed font-medium">Monitors MongoDB for changes via Change Streams. Instantly pushes new Circuit Breaker settings to running sidecars over Webhooks.</p>
                                </div>
                                <div className="bg-gradient-to-br from-rose-900/30 to-slate-900 border border-rose-500/20 p-8 rounded-[2rem] relative overflow-hidden group md:col-span-2 shadow-xl hover:border-rose-500/40 transition-colors flex items-center gap-8">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-3xl rounded-full"></div>
                                    <div className="flex-shrink-0 bg-rose-500/10 p-4 rounded-3xl border border-rose-500/20"><Network className="text-rose-400 drop-shadow-[0_0_15px_#fb7185]" size={48}/></div>
                                    <div>
                                        <h3 className="text-xl font-black text-rose-100 mb-3">The Sidecar Proxies (Data Plane)</h3>
                                        <p className="text-sm text-rose-200/80 leading-relaxed max-w-2xl font-medium">A micro-proxy deployed exactly next to every service. Service A talks to its Sidecar, which establishes an encrypted connection to Service B's Sidecar, which then hands the request to Service B. If Service B is slow, Service A's Sidecar trips the circuit breaker independently without needing code from Service A!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* REGISTRATION MODAL */}
            <AnimatePresence>
                {showRegisterModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegisterModal(false)} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[2rem] shadow-2xl p-8 overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px]" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px]" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><Plus size={24} /></div>
                                    <div><h2 className="text-xl font-black tracking-tight text-white">Register Workload</h2><p className="text-xs text-slate-400 mt-1">Add a new service to the mesh registry</p></div>
                                </div>
                                <button onClick={() => setShowRegisterModal(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleRegister} className="space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Service Name</label>
                                        <input required value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[#020617] border border-white/5 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 text-white font-bold" placeholder="e.g. catalog-service" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">URL / Endpoint</label><input required value={regForm.url} onChange={(e) => setRegForm({ ...regForm, url: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[#020617] border border-white/5 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 text-sm font-mono text-slate-300" placeholder="http://localhost:3003" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Version</label><input required value={regForm.version} onChange={(e) => setRegForm({ ...regForm, version: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-[#020617] border border-white/5 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 text-sm font-mono text-slate-300" placeholder="v1.0.0" /></div>
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 px-6 py-4 rounded-2xl font-black text-sm bg-white/5 hover:bg-white/10 text-slate-400 transition-all active:scale-95">Dismiss</button>
                                    <button type="submit" className="flex-[2] px-6 py-4 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95">Confirm Identity</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
