import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

type Edificio = {
  id: number;
  nombre: string;
  direccion?: string;
  expensasBase?: number;
  gastosExtra?: number;
  cantidadDepartamentos?: number;
  cantidadInquilinos?: number;
};

type UnidadInquilino = {
  id: number;
  edificio?: { id: number };
  inquilino?: { 
    id?: number; 
    email?: string; 
    activo?: boolean;
  };
  montoAlquiler?: number;
  porcentajeDepartamento?: number;
};

export default function InquilinoEdificios() {
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [unidadesPorEdificio, setUnidadesPorEdificio] = useState<Record<number, UnidadInquilino>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [edificioExpandido, setEdificioExpandido] = useState<number | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'TARJETA' | 'EFECTIVO' | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [deudasPorEdificio, setDeudasPorEdificio] = useState<Record<number, number>>({});
  const [deudaPendienteTotal, setDeudaPendienteTotal] = useState(0);

  useEffect(() => {
    const fetchDatos = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { navigate("/login"); return; }
      try {
        const res = await fetch(`${API_BASE}/api/edificios/mis-edificios`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setEdificios(data);
        
        const unidadesRes = await fetch(`${API_BASE}/api/unidades`, { headers: { Authorization: `Bearer ${token}` } });
        if (unidadesRes.ok) {
          const unidades = await unidadesRes.json();
          const porEdificio = unidades.reduce((acc: any, u: any) => {
            if (u.edificio?.id) acc[u.edificio.id] = u;
            return acc;
          }, {});
          setUnidadesPorEdificio(porEdificio);
        }
      } catch (err) { setError("Error al conectar con el servidor."); } finally { setLoading(false); }
    };
    fetchDatos();
  }, [navigate]);

  useEffect(() => {
    const fetchDeudas = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token || edificios.length === 0) return;
        try {
          const response = await fetch(`${API_BASE}/api/deudas/mis-deudas`, { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) return;
          const deudas = await response.json();
          
          const acumuladas: Record<number, number> = {};
          let totalGral = 0;

          deudas.forEach((d: any) => {
            if (d.estado !== 'PAGADO') {
                totalGral += d.montoPendiente;
                acumuladas[d.edificioId] = (acumuladas[d.edificioId] || 0) + d.montoPendiente;
            }
          });

          setDeudasPorEdificio(acumuladas);
          setDeudaPendienteTotal(totalGral);
        } catch (e) { console.error(e); }
    };
    fetchDeudas();
  }, [edificios]);

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
          nota: `Pago realizado desde el portal de inquilinos via ${metodo}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al procesar el pago");
      }

      alert(
        metodo === "TARJETA"
          ? "¡Pago procesado con éxito!"
          : "Solicitud de pago en efectivo enviada. Pendiente de aprobación."
      );

      setEdificioExpandido(null);
      setMetodoSeleccionado(null);

      window.location.reload();

    } catch (err) {
      console.error(err);
      alert("Hubo un error al registrar el pago. Por favor intenta de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Cargando tu información...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Alquileres</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus pagos y contratos</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saldo Pendiente</p>
          <p className="text-2xl font-black text-slate-900">${deudaPendienteTotal.toLocaleString('es-AR')}</p>
        </div>
      </header>

      <div className="grid gap-6">
        {edificios.map((e) => {
          const deudaTotal = deudasPorEdificio[e.id] || 0;
          const estaAlDia = deudaTotal <= 0;
          // Aquí es donde se usaba la propiedad: inquilino?.activo
          const usuarioActivo = unidadesPorEdificio[e.id]?.inquilino?.activo !== false;

          return (
            <div key={e.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${!usuarioActivo ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-extrabold text-gray-900">{e.nombre}</h2>
                    {usuarioActivo ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 flex gap-1 items-center">
                            <ShieldCheck className="size-3"/> Activo
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="flex gap-1 items-center">
                            <ShieldAlert className="size-3"/> Inactivo / Vencido
                        </Badge>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{e.direccion}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-3 min-w-[260px]">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estado de Cuenta</p>
                    <p className={`text-2xl font-black ${estaAlDia ? 'text-green-600' : 'text-slate-900'}`}>
                      {estaAlDia ? 'MES PAGADO' : `$${deudaTotal.toLocaleString('es-AR')}`}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => togglePanel(e.id, 'TARJETA')}
                      disabled={estaAlDia || !usuarioActivo}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        estaAlDia || !usuarioActivo 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {estaAlDia ? 'PAGADO' : '💳 TARJETA'}
                    </button>
                    <button 
                      onClick={() => togglePanel(e.id, 'EFECTIVO')}
                      disabled={estaAlDia || !usuarioActivo}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        estaAlDia || !usuarioActivo 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {estaAlDia ? 'AL DÍA' : '💵 EFECTIVO'}
                    </button>
                  </div>
                  {!usuarioActivo && <p className="text-[10px] text-red-500 font-bold italic">Contrato finalizado</p>}
                </div>
              </div>

              {edificioExpandido === e.id && !estaAlDia && (
                <div className="bg-blue-50/50 border-t p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="max-w-md mx-auto text-center">
                    <h3 className="font-bold text-blue-900 mb-4">Confirmar pago vía {metodoSeleccionado}</h3>
                    <p className="text-sm text-gray-600 mb-4">Se procesará el pago de ${deudaTotal.toLocaleString('es-AR')}</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setEdificioExpandido(null)}>Cancelar</Button>
                        <Button 
                            className="flex-1 bg-blue-600 text-white" 
                            onClick={() => confirmarPago(e.id, metodoSeleccionado!)}
                            disabled={procesando}
                        >
                            {procesando ? "Procesando..." : "Confirmar"}
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