import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, ShieldAlert, History, CalendarDays } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

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
    fechaFinContrato?: string; // Formato ISO, ej: "2024-05-01T00:00:00"
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

  const navigate = useNavigate();

  // --- FUNCIÓN DE AYUDA PARA FORMATEAR LA FECHA ---
  const formatearFecha = (fechaISO: string | undefined): string => {
    if (!fechaISO) return "Sin fecha";
    // Solo tomamos la parte de la fecha (AAAA-MM-DD) y quitamos la hora
    const [fecha] = fechaISO.split('T');
    const [anio, mes, dia] = fecha.split('-');
    // Devolvemos en formato local (DD/MM/AAAA)
    return `${dia}/${mes}/${anio}`;
  };

  useEffect(() => {
    const fetchDatos = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { navigate("/login"); return; }
      try {
        // 1. Cargar edificios
        const res = await fetch(`${API_BASE}/api/edificios/mis-edificios`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        setEdificios(data);
        
        // 2. Cargar unidades para ver el estado del inquilino
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

        // 3. Cargar deudas
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

  const togglePanel = (id: number, metodo: 'TARJETA' | 'EFECTIVO') => {
    if (edificioExpandido === id && metodoSeleccionado === metodo) {
      setEdificioExpandido(null);
      setMetodoSeleccionado(null);
    } else {
      setEdificioExpandido(id);
      setMetodoSeleccionado(metodo);
    }
  };

  const confirmarPago = async (edificioId: number, metodo: string) => {
    setProcesando(true);
    const token = localStorage.getItem("auth_token");
    const montoAEnviar = deudasPorEdificio[edificioId] || 0;

    try {
      const response = await fetch(`${API_BASE}/api/pagos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          edificioId,
          monto: montoAEnviar,
          metodo: metodo,
          nota: `Pago vía portal inquilino: ${metodo}`,
        }),
      });

      if (!response.ok) throw new Error("Error en el pago");

      alert(metodo === "TARJETA" ? "¡Pago exitoso!" : "Pago en efectivo pendiente de aprobación.");
      window.location.reload();
    } catch (err) {
      alert("Error al registrar el pago.");
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
          
          // Lógica de Actividad
          const usuarioActivo = inquilinoInfo?.activo !== false;

          return (
            <div key={e.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${!usuarioActivo ? 'opacity-75 grayscale-[0.5] border-red-100 bg-red-50/20' : ''}`}>
              <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{e.nombre}</h2>
                    
                    {/* BADGES DE ESTADO ACTUALIZADOS */}
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
                  
                  {/* --- MENSAJE DE VENCIMIENTO REFORMATEADO --- */}
                  {!usuarioActivo && (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-red-100/50 rounded-lg text-sm border border-red-200">
                        <CalendarDays className="size-5 text-red-600" />
                        <p className="text-red-700 font-medium">
                            Contrato expirado el <strong className="font-bold">{formatearFecha(inquilinoInfo?.fechaFinContrato)}</strong>
                        </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border p-4 rounded-xl min-w-[260px] text-center">
                  <p className="text-2xl font-black mb-3">{estaAlDia ? '✅ AL DÍA' : `$${deudaTotal.toLocaleString('es-AR')}`}</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => togglePanel(e.id, 'TARJETA')}
                      disabled={estaAlDia || !usuarioActivo}
                      className="flex-1 bg-blue-600 text-white"
                    >💳 Tarjeta</Button>
                    <Button 
                      onClick={() => togglePanel(e.id, 'EFECTIVO')}
                      disabled={estaAlDia || !usuarioActivo}
                      className="flex-1 bg-orange-500 text-white"
                    >💵 Efectivo</Button>
                  </div>
                  {!usuarioActivo && <p className="text-[10px] text-red-500 font-bold mt-1.5 uppercase tracking-wider">Pagos deshabilitados</p>}
                </div>
              </div>

              {edificioExpandido === e.id && (
                <div className="bg-blue-50 border-t p-6 text-center">
                  <h3 className="font-bold mb-4">Confirmar pago vía {metodoSeleccionado}</h3>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setEdificioExpandido(null)}>Cancelar</Button>
                    <Button className="bg-blue-700 text-white" onClick={() => confirmarPago(e.id, metodoSeleccionado!)} disabled={procesando}>
                      {procesando ? "Procesando..." : "Confirmar Pago"}
                    </Button>
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