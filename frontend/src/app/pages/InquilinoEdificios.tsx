import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, ShieldAlert, CalendarDays, DollarSign, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea"; 

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

type Edificio = {
  id: number;
  nombre: string;
  direccion?: string;
};

type UnidadInquilino = {
  id: number;
  edificio?: { id: number };
  inquilino?: { 
    id?: number; 
    email?: string; 
    activo?: boolean;
    fechaFinContrato?: string;
  };
};

export default function InquilinoEdificios() {
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [unidadesPorEdificio, setUnidadesPorEdificio] = useState<Record<number, UnidadInquilino>>({});
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [edificioExpandido, setEdificioExpandido] = useState<number | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'TARJETA' | 'EFECTIVO' | null>(null);
  const [deudasPorEdificio, setDeudasPorEdificio] = useState<Record<number, number>>({});
  const [deudaPendienteTotal, setDeudaPendienteTotal] = useState(0);

  const [montoManual, setMontoManual] = useState<string>("");
  const [comentario, setComentario] = useState<string>(""); 

  const navigate = useNavigate();

  const formatearFecha = (fechaISO: string | undefined): string => {
    if (!fechaISO) return "Sin fecha";
    const [fecha] = fechaISO.split('T');
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  useEffect(() => {
    const fetchDatos = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { navigate("/login"); return; }
      try {
        const res = await fetch(`${API_BASE}/api/edificios/mis-edificios`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        setEdificios(data);
        
        const unidadesRes = await fetch(`${API_BASE}/api/unidades`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (unidadesRes.ok) {
          const unidades = await unidadesRes.json();
          const porEdificio = unidades.reduce((acc: any, u: any) => {
            if (u.edificio?.id) acc[u.edificio.id] = u;
            return acc;
          }, {});
          setUnidadesPorEdificio(porEdificio);
        }

        const deudasRes = await fetch(`${API_BASE}/api/deudas/mis-deudas`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (deudasRes.ok) {
          const deudas = await deudasRes.json();
          const acumuladas: Record<number, number> = {};
          let totalGral = 0;
          deudas.forEach((d: any) => {
            if (d.estado !== 'PAGADO' && d.estado !== 'CANCELADA') {
                totalGral += d.montoPendiente;
                acumuladas[d.edificioId] = (acumuladas[d.edificioId] || 0) + d.montoPendiente;
            }
          });
          setDeudasPorEdificio(acumuladas);
          setDeudaPendienteTotal(totalGral);
        }
      } catch (err) { 
        console.error("Error al conectar con el servidor."); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchDatos();
  }, [navigate]);

  const togglePanel = (id: number, metodo: 'TARJETA' | 'EFECTIVO', deudaActual: number) => {
    if (edificioExpandido === id && metodoSeleccionado === metodo) {
      setEdificioExpandido(null);
      setMetodoSeleccionado(null);
      setMontoManual("");
      setComentario("");
    } else {
      setEdificioExpandido(id);
      setMetodoSeleccionado(metodo);
      setMontoManual(deudaActual.toString());
      setComentario(""); 
    }
  };

  const confirmarPago = async (edificioId: number, metodo: string) => {
    const valorFinal = metodo === 'EFECTIVO' ? 0 : parseFloat(montoManual);
    const deudaTotal = deudasPorEdificio[edificioId] || 0;

    if (metodo === 'TARJETA') {
        if (isNaN(valorFinal) || valorFinal <= 0) {
            alert("Por favor, ingresá un monto válido.");
            return;
        }
        if (valorFinal > deudaTotal) {
            alert("No podés pagar más de lo que debés.");
            return;
        }
    }

    setProcesando(true);
    const token = localStorage.getItem("auth_token");

    const notaFinal = metodo === 'EFECTIVO' 
        ? (comentario.trim() || "Aviso: Pasaré a pagar en efectivo.") 
        : `Pago Online vía Tarjeta: $${valorFinal}`;

    try {
      const response = await fetch(`${API_BASE}/api/pagos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          edificioId,
          monto: valorFinal,
          metodo: metodo,
          nota: notaFinal,
        }),
      });

      if (!response.ok) throw new Error("Error en el pago");

      alert(metodo === "TARJETA" ? "¡Pago exitoso!" : "Aviso enviado. El administrador registrará el cobro cuando pases.");
      window.location.reload();
    } catch (err) {
      alert("Error al procesar la solicitud.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Cargando...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Mis Alquileres</h1>
          <p className="text-gray-500 text-sm">Estado de cuenta y pagos</p>
        </div>
        <div className="bg-slate-50 border px-4 py-2 rounded-xl text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pendiente</p>
          <p className="text-2xl font-black text-slate-900">${deudaPendienteTotal.toLocaleString('es-AR')}</p>
        </div>
      </header>

      <div className="grid gap-6">
        {edificios.map((e) => {
          const deudaTotal = deudasPorEdificio[e.id] || 0;
          const estaAlDia = deudaTotal <= 0;
          const inquilinoInfo = unidadesPorEdificio[e.id]?.inquilino;
          const usuarioActivo = inquilinoInfo?.activo !== false;

          return (
            <div key={e.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${!usuarioActivo ? 'opacity-75 grayscale-[0.5] border-red-100 bg-red-50/20' : ''}`}>
              <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{e.nombre}</h2>
                    {usuarioActivo ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 font-bold">
                        <ShieldCheck className="size-3 mr-1"/> Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 font-black bg-red-600">
                        <ShieldAlert className="size-3"/> Inactivo / Vencido
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{e.direccion}</p>
                  
                  {!usuarioActivo && (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-red-100/50 rounded-lg text-sm border border-red-200">
                        <CalendarDays className="size-5 text-red-600" />
                        <p className="text-red-700 font-medium">
                            Contrato expirado el <strong className="font-bold">{formatearFecha(inquilinoInfo?.fechaFinContrato)}</strong>
                        </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border p-4 rounded-xl min-w-[260px] text-center flex flex-col justify-center">
                  {estaAlDia ? (
                    // --- VISTA CUANDO NO HAY DEUDA ---
                    <div className="py-2">
                        <div className="flex flex-col items-center gap-1">
                            <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm animate-in zoom-in duration-300">
                                <CheckCircle2 className="size-5" />
                                <span className="text-lg font-black tracking-tight uppercase">¡AL DÍA!</span>
                            </div>
                            <p className="text-[10px] text-green-600 font-bold uppercase mt-1">Sin pagos pendientes</p>
                        </div>
                    </div>
                  ) : (
                    // --- VISTA CUANDO HAY DEUDA ---
                    <>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Deuda Pendiente</p>
                        <p className="text-2xl font-black mb-3 text-slate-900">${deudaTotal.toLocaleString('es-AR')}</p>
                        <div className="flex gap-2">
                            <Button 
                            onClick={() => togglePanel(e.id, 'TARJETA', deudaTotal)}
                            disabled={!usuarioActivo}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >💳 Tarjeta</Button>
                            <Button 
                            onClick={() => togglePanel(e.id, 'EFECTIVO', deudaTotal)}
                            disabled={!usuarioActivo}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                            >💵 Efectivo</Button>
                        </div>
                    </>
                  )}
                  {!usuarioActivo && !estaAlDia && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 uppercase tracking-wider">Pagos bloqueados</p>
                  )}
                </div>
              </div>

              {edificioExpandido === e.id && (
                <div className="bg-slate-50 border-t p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="max-w-sm mx-auto space-y-4">
                    <div className="text-center">
                        <h3 className="font-bold text-slate-900">
                            {metodoSeleccionado === 'TARJETA' ? 'Pago con Tarjeta' : 'Aviso de Pago en Efectivo'}
                        </h3>
                    </div>
                    
                    {metodoSeleccionado === 'TARJETA' ? (
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                            <Input 
                                type="number"
                                value={montoManual}
                                onChange={(e) => setMontoManual(e.target.value)}
                                className="pl-9 font-black text-lg focus-visible:ring-blue-600"
                                placeholder="0.00"
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 text-slate-400 size-4" />
                            <Textarea 
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                className="pl-9 min-h-[90px] focus-visible:ring-orange-500 border-slate-200"
                                placeholder="Ej: Paso mañana a las 18 hs a pagar..."
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEdificioExpandido(null)}>Cancelar</Button>
                        <Button 
                            className={`flex-1 font-bold text-white ${metodoSeleccionado === 'TARJETA' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-orange-600 hover:bg-orange-700'}`} 
                            onClick={() => confirmarPago(e.id, metodoSeleccionado!)}
                            disabled={procesando}
                        >
                            {procesando ? "Enviando..." : (metodoSeleccionado === 'TARJETA' ? "Confirmar Pago" : "Enviar Aviso")}
                        </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}