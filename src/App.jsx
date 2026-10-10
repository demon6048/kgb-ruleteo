import React, { useState, useMemo } from 'react';
import { 
  Activity, Calendar, AlertCircle, ShieldCheck, 
  Zap, ChevronRight, CheckCircle2, TrendingDown, Wallet
} from 'lucide-react';

export default function App() {
  // Estado inicial de las deudas
  const [deudas, setDeudas] = useState([
    { id: 1, prestamista: 'José', total: 800, cuota: 50, pagado: 0 },
    { id: 2, prestamista: 'Dylan', total: 480, cuota: 20, pagado: 0 },
    { id: 3, prestamista: 'Steven', total: 320, cuota: 20, pagado: 0 },
    { id: 4, prestamista: 'Joel', total: 250, cuota: 25, pagado: 0 },
    { id: 5, prestamista: 'Cristian', total: 250, cuota: 25, pagado: 0 },
  ]);

  const ingresoEsperado = 3000;
  const diasRestantesCapital = 14;

  // Lógica financiera calculada al instante
  const metricas = useMemo(() => {
    let fugaDiariaActiva = 0;
    let deudaTotalPendiente = 0;
    let totalPagadoGeneral = 0;

    deudas.forEach(d => {
      const pendiente = d.total - d.pagado;
      deudaTotalPendiente += pendiente;
      totalPagadoGeneral += d.pagado;
      if (pendiente > 0) {
        fugaDiariaActiva += d.cuota;
      }
    });

    return { fugaDiariaActiva, deudaTotalPendiente, totalPagadoGeneral };
  }, [deudas]);

  const registrarPago = (id) => {
    setDeudas(deudas.map(deuda => {
      if (deuda.id === id) {
        const pendiente = deuda.total - deuda.pagado;
        if (pendiente <= 0) return deuda; // Ya está pagado
        
        // Paga la cuota, o lo que reste si es menor a la cuota
        const montoAPagar = Math.min(deuda.cuota, pendiente);
        return { ...deuda, pagado: deuda.pagado + montoAPagar };
      }
      return deuda;
    }));
  };

  return (
    // Contenedor principal: Fondo oscuro, altura mínima completa, centrado en pantallas grandes
    <div className="min-h-screen bg-[#0a0f1a] text-slate-300 font-sans selection:bg-cyan-500/30">
      
      {/* Contenedor limitador (hace que en laptop se vea "cuadrado" y centrado, no estirado) */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800/60 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
              <Activity className="text-cyan-400 w-6 h-6 relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                KGB RULETEO <span className="text-xs text-cyan-500 align-top font-bold uppercase tracking-widest ml-1">v3.0</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium tracking-wide">Centro de Comando Táctico</p>
            </div>
          </div>
          
          {/* Badge de estado */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Sistema En Línea</span>
          </div>
        </header>

        {/* PANEL DE MÉTRICAS (Grid: 1 col en móvil, 3 en laptop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 lg:mb-12">
          
          {/* Tarjeta: Fuga Diaria */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-red-500/30 transition-colors rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown className="w-16 h-16 text-red-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="text-red-400 w-5 h-5" />
              <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase">Fuga Diaria</h2>
            </div>
            <p className="text-4xl md:text-5xl font-black text-white">
              <span className="text-red-500/80 text-2xl mr-1">S/</span>{metricas.fugaDiariaActiva}
            </p>
          </div>

          {/* Tarjeta: Deuda Restante */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-amber-500/30 transition-colors rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-16 h-16 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Zap className="text-amber-400 w-5 h-5" />
              <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase">Deuda Restante</h2>
            </div>
            <p className="text-4xl md:text-5xl font-black text-white">
              <span className="text-amber-500/80 text-2xl mr-1">S/</span>{metricas.deudaTotalPendiente}
            </p>
          </div>

          {/* Tarjeta: Días Críticos */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-cyan-500/30 transition-colors rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="w-16 h-16 text-cyan-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-cyan-400 w-5 h-5" />
              <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase">Días para Capital</h2>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl md:text-5xl font-black text-cyan-400">{diasRestantesCapital}</p>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Días</p>
            </div>
          </div>
        </div>

        {/* ÁREA PRINCIPAL: Dividida en Laptop, apilada en Móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: Lista de Deudas (Ocupa 2 espacios en laptop) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-cyan-500 rounded-full"></span>
                Operaciones Activas
              </h2>
            </div>

            <div className="space-y-4">
              {deudas.map((deuda) => {
                const pendiente = deuda.total - deuda.pagado;
                const porcentaje = Math.min((deuda.pagado / deuda.total) * 100, 100);
                const isSaldado = pendiente <= 0;

                return (
                  <div key={deuda.id} 
                    className={`relative p-5 md:p-6 rounded-2xl border transition-all duration-300 ${
                      isSaldado 
                        ? 'bg-emerald-950/20 border-emerald-900/30 opacity-60' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-lg'
                    }`}>
                    
                    {/* Barra de progreso de fondo */}
                    <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full rounded-b-2xl overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${isSaldado ? 'bg-emerald-500' : 'bg-cyan-500'}`} 
                           style={{ width: `${porcentaje}%` }}></div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Info del Prestamista */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-white">{deuda.prestamista}</h3>
                          {isSaldado && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Completado</span>}
                        </div>
                        <p className="text-sm text-slate-400">
                          Deuda total: S/ {deuda.total}
                        </p>
                      </div>

                      {/* Info de Cuota y Botón (Diseño responsive) */}
                      <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 border-t border-slate-800/50 md:border-0 pt-4 md:pt-0 mt-2 md:mt-0">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Cuota Diaria</p>
                          <p className={`text-xl font-black ${isSaldado ? 'text-slate-500' : 'text-red-400'}`}>
                            S/ {deuda.cuota}
                          </p>
                        </div>

                        {!isSaldado ? (
                          <button 
                            onClick={() => registrarPago(deuda.id)}
                            className="flex items-center gap-2 px-6 py-3 md:py-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold transition-all active:scale-95 group">
                            Pagar
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-6 py-3 md:py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-bold cursor-default">
                            <CheckCircle2 className="w-5 h-5" />
                            Listo
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: Estrategia (Ocupa 1 espacio en laptop, se apila al final en móvil) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                Estrategia
              </h2>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">Plan de Contención</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                En 10 días finalizan <span className="text-white font-medium">Joel y Cristian</span>, reduciendo la fuga diaria drásticamente. 
              </p>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Ingreso Proyectado (Día 14)</p>
                <p className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  S/ {ingresoEsperado}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Destinado a liquidar: José, Dylan y Steven.
                </p>
              </div>
            </div>

            {/* Resumen de Progreso General */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
               <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Progreso Global</h3>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-slate-400">Total Pagado</span>
                 <span className="text-white font-bold">S/ {metricas.totalPagadoGeneral}</span>
               </div>
               <div className="w-full bg-slate-950 rounded-full h-2">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500" 
                       style={{ width: `${(metricas.totalPagadoGeneral / (metricas.totalPagadoGeneral + metricas.deudaTotalPendiente)) * 100 || 0}%` }}>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}