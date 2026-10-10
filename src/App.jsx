import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, ArrowRight, Zap, Users, UserPlus, PlusCircle, CheckCircle2, 
  AlertTriangle, Coins, Briefcase, CalendarClock, CreditCard, X, Smartphone
} from 'lucide-react';

// FIREBASE
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, collection, onSnapshot, addDoc, updateDoc
} from "firebase/firestore";

// 1. TU CONFIGURACIÓN REAL DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCmbxOXJ1tmsnK2v2q9DdhoWoITzFa0cac",
  authDomain: "kgb-ruleteo.firebaseapp.com",
  projectId: "kgb-ruleteo",
  storageBucket: "kgb-ruleteo.firebasestorage.app",
  messagingSenderId: "189512551231",
  appId: "1:189512551231:web:ce9ed7e43a420f1d7aa18a"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, prestamistas, cobros

  const [prestamistas, setPrestamistas] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [cobros, setCobros] = useState([]);

  // Estados para formularios modales
  const [showPrestamistaForm, setShowPrestamistaForm] = useState(false);
  const [showDeudaForm, setShowDeudaForm] = useState(false);
  const [showCobroForm, setShowCobroForm] = useState(false);

  // 2. SINCRONIZACIÓN EN TIEMPO REAL
  useEffect(() => {
    // Escuchar Prestamistas
    const unsubPrestamistas = onSnapshot(collection(db, 'prestamistas'), (snapshot) => {
      setPrestamistas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error prestamistas:", error));

    // Escuchar Deudas
    const unsubDeudas = onSnapshot(collection(db, 'deudas'), (snapshot) => {
      setDeudas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error deudas:", error));

    // Escuchar Cobros
    const unsubCobros = onSnapshot(collection(db, 'cobros'), (snapshot) => {
      setCobros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error cobros:", error));

    return () => {
      unsubPrestamistas();
      unsubDeudas();
      unsubCobros();
    };
  }, []);

  // 3. CÁLCULOS Y LÓGICA FINANCIERA
  const totalDebt = useMemo(() => deudas.reduce((acc, curr) => acc + (Number(curr.monto_total) || 0), 0), [deudas]);
  const totalPaid = useMemo(() => deudas.reduce((acc, curr) => acc + (Number(curr.pagado) || 0), 0), [deudas]);
  const totalRemaining = totalDebt - totalPaid;

  const currentDailyQuota = useMemo(() => 
    deudas.reduce((acc, curr) => {
      const remaining = (Number(curr.monto_total) || 0) - (Number(curr.pagado) || 0);
      return remaining > 0 ? acc + (Number(curr.cuota_diaria) || 0) : acc;
    }, 0)
  , [deudas]);

  const cobrosPendientes = useMemo(() => 
    cobros.reduce((acc, curr) => acc + (curr.estado !== 'pagado' ? (Number(curr.monto) || 0) : 0), 0)
  , [cobros]);

  const maxDaysLeft = useMemo(() => {
    let max = 0;
    deudas.forEach(d => {
      const remaining = (Number(d.monto_total) || 0) - (Number(d.pagado) || 0);
      const cuota = Number(d.cuota_diaria) || 1;
      if (remaining > 0) {
        const days = Math.ceil(remaining / cuota);
        if (days > max) max = days;
      }
    });
    return max;
  }, [deudas]);

  const projectionData = useMemo(() => {
    const data = [];
    const daysToShow = Math.min(Math.max(maxDaysLeft + 2, 5), 30); 
    
    for (let i = 1; i <= daysToShow; i++) {
      let dailyTotalForDay = 0;
      deudas.forEach(d => {
        const remaining = (Number(d.monto_total) || 0) - (Number(d.pagado) || 0);
        const cuota = Number(d.cuota_diaria) || 1;
        if (remaining > 0) {
          const daysLeft = Math.ceil(remaining / cuota);
          if (daysLeft >= i) {
            dailyTotalForDay += cuota;
          }
        }
      });
      data.push({
        day: `Día ${i}`,
        cuota: dailyTotalForDay
      });
    }
    return data;
  }, [deudas, maxDaysLeft]);

  // 4. ACCIONES
  const handlePayment = async (deuda) => {
    const montoTotal = Number(deuda.monto_total) || 0;
    const pagado = Number(deuda.pagado) || 0;
    const cuota = Number(deuda.cuota_diaria) || 0;
    
    const remaining = montoTotal - pagado;
    if (remaining <= 0) return;

    const pago = Math.min(cuota, remaining);
    const newPaid = pagado + pago;

    try {
      const docRef = doc(db, 'deudas', deuda.id);
      await updateDoc(docRef, { pagado: newPaid });
    } catch (e) {
      console.error("Error al registrar pago", e);
    }
  };

  const getPrestamistaPhone = (id) => {
    const p = prestamistas.find(p => p.id === id);
    return p ? p.telefono : '';
  };
  
  const getPrestamistaName = (id) => {
    const p = prestamistas.find(p => p.id === id);
    return p ? p.nombre : 'Desconocido';
  };

  // 5. FORMULARIOS MODALES
  const FormularioPrestamista = () => {
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!nombre || !telefono) return;
      try {
        await addDoc(collection(db, 'prestamistas'), { nombre, telefono });
        setShowPrestamistaForm(false);
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="text-purple-400" /> Nuevo Contacto
            </h3>
            <button type="button" onClick={() => setShowPrestamistaForm(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
          </div>
          <input type="text" placeholder="Nombre (Ej. José)" value={nombre} onChange={e => setNombre(e.target.value)}
            className="w-full mb-3 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:border-purple-500 focus:outline-none" required />
          <input type="tel" placeholder="Teléfono (+51...)" value={telefono} onChange={e => setTelefono(e.target.value)}
            className="w-full mb-6 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:border-purple-500 focus:outline-none" required />
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowPrestamistaForm(false)} className="flex-1 py-3 text-slate-400 font-semibold rounded-lg hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.5)]">Guardar</button>
          </div>
        </form>
      </div>
    );
  };

  const FormularioDeuda = () => {
    const [prestamistaId, setPrestamistaId] = useState('');
    const [montoTotal, setMontoTotal] = useState('');
    const [cuotaDiaria, setCuotaDiaria] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!prestamistaId || !montoTotal || !cuotaDiaria) return;
      try {
        await addDoc(collection(db, 'deudas'), { 
          prestamista_id: prestamistaId, 
          monto_total: Number(montoTotal), 
          cuota_diaria: Number(cuotaDiaria), 
          pagado: 0 
        });
        setShowDeudaForm(false);
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_30px_rgba(34,211,238,0.15)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="text-cyan-400" /> Nuevo Préstamo
            </h3>
            <button type="button" onClick={() => setShowDeudaForm(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
          </div>
          
          <select value={prestamistaId} onChange={e => setPrestamistaId(e.target.value)} required
            className="w-full mb-3 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:border-cyan-500 focus:outline-none appearance-none">
            <option value="" disabled>Selecciona al Prestamista...</option>
            {prestamistas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          {prestamistas.length === 0 && <p className="text-xs text-rose-400 mb-3 -mt-1">Primero agrega un contacto en Admin.</p>}

          <input type="number" placeholder="Monto Total a Pagar S/" value={montoTotal} onChange={e => setMontoTotal(e.target.value)}
            className="w-full mb-3 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:border-cyan-500 focus:outline-none" required />
          <input type="number" placeholder="Cuota Diaria Acordada S/" value={cuotaDiaria} onChange={e => setCuotaDiaria(e.target.value)}
            className="w-full mb-6 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:border-cyan-500 focus:outline-none" required />
          
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowDeudaForm(false)} className="flex-1 py-3 text-slate-400 font-semibold rounded-lg hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={prestamistas.length === 0} className="flex-1 py-3 bg-cyan-600 disabled:bg-slate-800 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.5)]">Guardar</button>
          </div>
        </form>
      </div>
    );
  };

  const FormularioCobro = () => {
    const [deudor, setDeudor] = useState('');
    const [monto, setMonto] = useState('');
    const [fecha, setFecha] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!deudor || !monto) return;
      try {
        await addDoc(collection(db, 'cobros'), { deudor, monto: Number(monto), fecha_promesa: fecha, estado: 'pendiente' });
        setShowCobroForm(false);
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="text-emerald-400" /> Cuenta por Cobrar
            </h3>
            <button type="button" onClick={() => setShowCobroForm(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
          </div>
          <input type="text" placeholder="¿Quién te debe? (Cliente, etc.)" value={deudor} onChange={e => setDeudor(e.target.value)}
            className="w-full mb-3 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:border-emerald-500 focus:outline-none" required />
          <input type="number" placeholder="Monto S/" value={monto} onChange={e => setMonto(e.target.value)}
            className="w-full mb-3 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:border-emerald-500 focus:outline-none" required />
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="w-full mb-6 bg-slate-950 border border-slate-800 text-slate-400 p-3 rounded-lg focus:border-emerald-500 focus:outline-none" />
          
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCobroForm(false)} className="flex-1 py-3 text-slate-400 font-semibold rounded-lg hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)]">Guardar</button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* Fondo decorativo futurista */}
      <div className="absolute top-[-10%] left-[-20%] w-[140%] h-[50%] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* BARRA LATERAL (Solo visible en Laptop/Desktop) */}
      <aside className="hidden md:flex w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex-col z-20 relative shadow-2xl">
        <div className="p-8 border-b border-slate-800/50">
          <h1 className="text-3xl font-black text-white flex items-center gap-2 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
            <Zap className="text-cyan-400 fill-cyan-400 animate-pulse" />
            KGB
          </h1>
          <p className="text-sm text-slate-400 font-mono tracking-widest mt-1 uppercase">Ruleteo System</p>
        </div>
        
        <nav className="flex-1 p-6 space-y-4">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)] scale-105' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
            <Activity className="w-6 h-6" /> <span className="font-bold text-lg">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('cobros')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === 'cobros' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-105' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
            <Coins className="w-6 h-6" /> <span className="font-bold text-lg">Liquidez</span>
          </button>
          <button onClick={() => setActiveTab('prestamistas')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeTab === 'prestamistas' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] scale-105' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
            <Users className="w-6 h-6" /> <span className="font-bold text-lg">Panel Admin</span>
          </button>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Header Móvil */}
        <header className="md:hidden p-5 pt-8 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 flex justify-between items-center">
          <h1 className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            <Zap className="text-cyan-400 fill-cyan-400" /> KGB
          </h1>
          {activeTab === 'dashboard' && (
            <button onClick={() => setShowDeudaForm(true)} className="p-2 bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <PlusCircle size={20}/>
            </button>
          )}
        </header>

        {/* Área de Trabajo */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-28 md:pb-10 w-full max-w-7xl mx-auto">
          
          {/* ===================== DASHBOARD ===================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
              
              <div className="hidden md:flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Monitoreo de Deuda</h2>
                <button onClick={() => setShowDeudaForm(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-600/40 transition-all font-bold">
                  <PlusCircle className="w-5 h-5" /> Agregar Préstamo
                </button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg relative overflow-hidden">
                  <p className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Cuota Diaria Total</p>
                  <p className="text-2xl md:text-4xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    S/ {currentDailyQuota}
                  </p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg">
                  <p className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Días Críticos</p>
                  <p className="text-2xl md:text-4xl font-black text-white">
                    {maxDaysLeft} <span className="text-sm md:text-xl font-normal text-slate-500">días</span>
                  </p>
                </div>
                <div className="hidden md:block col-span-2 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 shadow-lg">
                  <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Deuda Total Restante</p>
                  <p className="text-4xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.3)]">
                    S/ {totalRemaining}
                  </p>
                  <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Gráfica de Proyección */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <h2 className="text-sm md:text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" /> Línea de Tiempo de Alivio
                </h2>
                <div className="h-40 md:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAlivio" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} itemStyle={{ color: '#34d399', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="cuota" stroke="#34d399" strokeWidth={3} fill="url(#colorAlivio)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lista de Deudas */}
              <div className="space-y-4">
                <h3 className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest pl-2">Ruta de Pagos Activa</h3>
                
                {deudas.length === 0 ? (
                  <div className="text-center p-12 border border-dashed border-slate-700 rounded-3xl text-slate-500 bg-slate-900/30">
                    <p className="mb-4">Tu base de datos está limpia.</p>
                    <button onClick={() => setShowDeudaForm(true)} className="px-6 py-3 bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 rounded-xl text-sm font-bold hover:bg-cyan-800/50 transition-all">
                      Registrar mi primera deuda
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {deudas.map(deuda => {
                      const mTotal = Number(deuda.monto_total) || 0;
                      const mPagado = Number(deuda.pagado) || 0;
                      const mCuota = Number(deuda.cuota_diaria) || 1;
                      
                      const remaining = mTotal - mPagado;
                      const isPaidOff = remaining <= 0;
                      const progressPercentage = Math.min((mPagado / mTotal) * 100, 100);
                      const cuotasRestantes = Math.ceil(remaining / mCuota);
                      
                      const alertRenovation = !isPaidOff && cuotasRestantes <= 3;
                      const prestamistaNombre = getPrestamistaName(deuda.prestamista_id);
                      const prestamistaTelf = getPrestamistaPhone(deuda.prestamista_id);

                      const mensajeRenovacion = `Hola ${prestamistaNombre}, ya estamos en la recta final, me faltan solo ${cuotasRestantes} cuotas. ¿Me puedes ir viendo una renovación para mantener el flujo?`;
                      const urlWhatsapp = `https://wa.me/${prestamistaTelf.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(mensajeRenovacion)}`;

                      return (
                        <div key={deuda.id} 
                          className={`relative p-5 md:p-6 rounded-3xl border overflow-hidden transition-all duration-300 ${
                            isPaidOff 
                              ? 'bg-slate-900/30 border-emerald-900/30 opacity-60' 
                              : alertRenovation 
                                ? 'bg-slate-900 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] md:hover:scale-105'
                                : 'bg-slate-900/80 backdrop-blur-md border-slate-700/50 shadow-lg md:hover:scale-105'
                          }`}>
                          
                          <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                            <div className={`h-full transition-all duration-1000 ${isPaidOff ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${progressPercentage}%` }}></div>
                          </div>

                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className="text-lg md:text-xl font-bold text-white">{prestamistaNombre}</h4>
                              <p className="text-xs md:text-sm text-slate-400 mt-1">
                                Resta: S/ {remaining} de S/ {mTotal}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="block text-2xl md:text-3xl font-black text-white drop-shadow-md">S/ {mCuota}</span>
                              <span className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 font-bold">Cuota</span>
                            </div>
                          </div>

                          {alertRenovation && prestamistaTelf && (
                            <a href={urlWhatsapp} target="_blank" rel="noopener noreferrer" 
                              className="mb-4 w-full flex items-center justify-center gap-2 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs md:text-sm font-bold hover:bg-amber-500/20 transition-colors shadow-inner">
                              <AlertTriangle className="w-4 h-4" />
                              Faltan {cuotasRestantes} - Pedir Renovación
                            </a>
                          )}

                          {!isPaidOff ? (
                            <button 
                              onClick={() => handlePayment(deuda)}
                              className="w-full py-4 md:py-3.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-500 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:text-white text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md group"
                            >
                              Pagar Cuota
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          ) : (
                            <div className="w-full py-4 md:py-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm md:text-base font-bold flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Saldado
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== LIQUIDEZ ===================== */}
          {activeTab === 'cobros' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                <p className="text-xs md:text-sm text-emerald-500/80 font-bold uppercase tracking-wider mb-2">Liquidez por Cobrar</p>
                <p className="text-4xl md:text-6xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  S/ {cobrosPendientes}
                </p>
              </div>

              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="text-emerald-400 w-5 h-5" /> Trabajos / Cachuelos
                </h2>
                <button onClick={() => setShowCobroForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-600/40 transition-all font-bold text-sm md:text-base">
                  <PlusCircle className="w-5 h-5" /> <span className="hidden md:inline">Añadir Trabajo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {cobros.filter(c => c.estado !== 'pagado').map(c => (
                  <div key={c.id} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl flex items-center justify-between shadow-lg">
                    <div>
                      <h3 className="font-bold text-white text-base md:text-lg">{c.deudor}</h3>
                      <p className="text-slate-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> {c.fecha_promesa || 'Sin fecha'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-emerald-400 text-lg bg-emerald-500/10 px-3 py-1 rounded-lg">S/ {c.monto}</span>
                      <button 
                        onClick={async () => await updateDoc(doc(db, 'cobros', c.id), { estado: 'pagado' })}
                        className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-600 transition-colors shadow-md group">
                        <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== ADMIN ===================== */}
          {activeTab === 'prestamistas' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                    <Users className="text-purple-400 w-6 h-6 md:w-8 md:h-8" /> Directorio Admin
                  </h2>
                </div>
                <button onClick={() => setShowPrestamistaForm(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-600/40 transition-all font-bold text-sm md:text-base">
                  <UserPlus className="w-5 h-5" /> <span className="hidden md:inline">Nuevo Contacto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {prestamistas.map(p => (
                  <div key={p.id} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-500/20">
                        <Smartphone className="text-purple-400 w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{p.nombre}</h3>
                        <p className="text-slate-400 text-sm font-mono mt-1">{p.telefono}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {prestamistas.length === 0 && (
                  <div className="col-span-full text-center p-12 border border-dashed border-slate-700 rounded-3xl text-slate-500 bg-slate-900/30">
                    Empieza añadiendo a tus prestamistas aquí.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALES */}
      {showPrestamistaForm && <FormularioPrestamista />}
      {showDeudaForm && <FormularioDeuda />}
      {showCobroForm && <FormularioCobro />}

      {/* BARRA MÓVIL (Solo Celular) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-6 py-4 flex justify-between items-center z-40 pb-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
          <Activity className="w-6 h-6" /> <span className="text-[10px] font-bold">Ruleteo</span>
        </button>
        <button onClick={() => setActiveTab('cobros')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'cobros' ? 'text-emerald-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
          <Coins className="w-6 h-6" /> <span className="text-[10px] font-bold">Liquidez</span>
        </button>
        <button onClick={() => setActiveTab('prestamistas')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'prestamistas' ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
          <Users className="w-6 h-6" /> <span className="text-[10px] font-bold">Admin</span>
        </button>
      </nav>
    </div>
  );
}