import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

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
  inquilino?: { id?: number; email?: string };
  montoAlquiler?: number;
  porcentajeDepartamento?: number;
};

type GastoComprobante = {
  id: number;
  type: string;
  amount: number;
  description?: string;
  date: string;
  receiptUrl?: string;
  receiptFileName?: string;
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
  const [mesComprobantes, setMesComprobantes] = useState(new Date().toISOString().slice(0, 7));
  const [comprobantesPorEdificio, setComprobantesPorEdificio] = useState<Record<number, GastoComprobante[]>>({});
  const [cargandoComprobantes, setCargandoComprobantes] = useState(false);

  const [notaEfectivo, setNotaEfectivo] = useState("");
  const [datosTarjeta, setDatosTarjeta] = useState({ numero: "", nombre: "", vencimiento: "", cvc: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchEdificios = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { navigate("/login"); return; }
      try {
        const authUserRaw = localStorage.getItem("auth_user");
        let authUser: { id?: number; email?: string } | null = null;
        if (authUserRaw) {
          try {
            authUser = JSON.parse(authUserRaw);
          } catch {
            authUser = null;
          }
        }
        const authUserEmail = String(authUser?.email || "").toLowerCase();
        const authUserId = typeof authUser?.id === "number" ? authUser.id : null;

        const res = await fetch(`${API_BASE}/api/edificios/mis-edificios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { navigate("/login"); return; }
        const data = await res.json();
        setEdificios(data);

        const unidadesRes = await fetch(`${API_BASE}/api/unidades`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (unidadesRes.ok) {
          const unidades = await unidadesRes.json();
          const unidadesDelInquilino = (Array.isArray(unidades) ? unidades : []).filter((u: UnidadInquilino) => {
            const emailUnidad = String(u?.inquilino?.email || "").toLowerCase();
            const idUnidad = typeof u?.inquilino?.id === "number" ? u.inquilino.id : null;
            return (authUserEmail && emailUnidad === authUserEmail) || (authUserId !== null && idUnidad === authUserId);
          });

          const porEdificio = unidadesDelInquilino.reduce((acc: Record<number, UnidadInquilino>, unidad: UnidadInquilino) => {
            const edificioId = unidad?.edificio?.id;
            if (typeof edificioId === "number" && !acc[edificioId]) {
              acc[edificioId] = unidad;
            }
            return acc;
          }, {});

          setUnidadesPorEdificio(porEdificio);
        }
      } catch (err) { setError("Error de red."); } finally { setLoading(false); }
    };
    fetchEdificios();
  }, [navigate]);

  useEffect(() => {
    const fetchComprobantes = async () => {
      if (edificios.length === 0) {
        setComprobantesPorEdificio({});
        return;
      }

      setCargandoComprobantes(true);

      try {
        const token = localStorage.getItem('auth_token');

        const resultados = await Promise.all(
          edificios.map(async (edificio) => {
            const params = new URLSearchParams({
              edificioId: String(edificio.id),
              month: mesComprobantes,
            });

            const response = await fetch(`${API_BASE}/api/gastos?${params.toString()}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (!response.ok) {
              return [edificio.id, []] as const;
            }

            const data = await response.json();
            return [edificio.id, Array.isArray(data) ? data : []] as const;
          }),
        );

        setComprobantesPorEdificio(Object.fromEntries(resultados));
      } catch {
        setComprobantesPorEdificio({});
      } finally {
        setCargandoComprobantes(false);
      }
    };

    fetchComprobantes();
  }, [edificios, mesComprobantes]);

  const toApiUrl = (path: string) => (path.startsWith('http') ? path : `${API_BASE}${path}`);

  const calcularDetallePago = (edificio: Edificio) => {
    const unidad = unidadesPorEdificio[edificio.id];
    const alquiler = unidad?.montoAlquiler || 0;
    const porcentajeRaw = unidad?.porcentajeDepartamento || 0;
    // Acepta 0.25 o 25 como entrada para evitar inconsistencias de carga histórica.
    const porcentajeNormalizado = porcentajeRaw > 1 ? porcentajeRaw / 100 : porcentajeRaw;
    const gastoExpensas = (edificio.expensasBase || 0) * porcentajeNormalizado;

    const gastosExtra = edificio.gastosExtra || 0;
    const divisor = (edificio.cantidadDepartamentos && edificio.cantidadDepartamentos > 0)
      ? edificio.cantidadDepartamentos
      : ((edificio.cantidadInquilinos && edificio.cantidadInquilinos > 0) ? edificio.cantidadInquilinos : 1);
    const gastoExtraProrrateado = gastosExtra / divisor;

    const totalPagar = alquiler + gastoExpensas + gastoExtraProrrateado;

    return {
      alquiler,
      porcentajeNormalizado,
      gastoExpensas,
      gastoExtraProrrateado,
      totalPagar,
    };
  };

  const togglePanel = (id: number, metodo: 'TARJETA' | 'EFECTIVO') => {
    if (edificioExpandido === id && metodoSeleccionado === metodo) {
      setEdificioExpandido(null);
      setMetodoSeleccionado(null);
    } else {
      setEdificioExpandido(id);
      setMetodoSeleccionado(metodo);
      setErrores({});
    }
  };

  const validarTarjeta = () => {
    const e: Record<string, string> = {};
    
    if (!/^\d{16}$/.test(datosTarjeta.numero.replace(/\s/g, ""))) {
      e.numero = "16 dígitos requeridos.";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datosTarjeta.vencimiento)) {
      e.vencimiento = "Formato MM/AA.";
    } else {

      const [mesStr, anioStr] = datosTarjeta.vencimiento.split('/');
      const mesIngresado = parseInt(mesStr, 10);
      const anioIngresado = parseInt(anioStr, 10);

      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth() + 1;
      const anioActual = parseInt(fechaActual.getFullYear().toString().slice(-2));

      if (anioIngresado < anioActual || (anioIngresado === anioActual && mesIngresado < mesActual)) {
        e.vencimiento = "Tarjeta vencida.";
      }
    }

    if (!/^\d{3}$/.test(datosTarjeta.cvc)) {
      e.cvc = "3 dígitos.";
    }

    if (datosTarjeta.nombre.trim().length < 3) {
      e.nombre = "Nombre inválido.";
    }

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  if (loading) return <p className="p-4">Cargando...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mis Alquileres</h1>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Comprobantes del mes</span>
          <input
            type="month"
            value={mesComprobantes}
            onChange={(ev) => setMesComprobantes(ev.target.value)}
            className="rounded-md border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6">
        {edificios.map((e) => {
          const detallePago = calcularDetallePago(e);

          return (
          <div key={e.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden border-gray-200">
            
            {/* --- CUERPO PRINCIPAL --- */}
            <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Info Izquierda */}
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-gray-900">{e.nombre}</h2>
                <p className="text-gray-500 text-sm">{e.direccion || "Dirección no disponible"}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>
                    Gasto expensas: ${detallePago.gastoExpensas.toLocaleString('es-AR')} 
                  </p>
                  <p>
                    Gasto extra prorrateado: ${detallePago.gastoExtraProrrateado.toLocaleString('es-AR')} 
                  </p>
                </div>
              </div>

              {/* RECUADRO DE PAGO (Monto + Botones juntos) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-3 min-w-[240px]">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total a Pagar</p>
                  <p className="text-3xl font-black text-slate-900">
                    ${detallePago.totalPagar.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alquiler ${detallePago.alquiler.toLocaleString('es-AR')} + Expensas ${detallePago.gastoExpensas.toLocaleString('es-AR')} + Extra ${detallePago.gastoExtraProrrateado.toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => togglePanel(e.id, 'TARJETA')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${edificioExpandido === e.id && metodoSeleccionado === 'TARJETA' ? 'bg-blue-700 text-white ring-2 ring-blue-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    💳 TARJETA
                  </button>
                  <button 
                    onClick={() => togglePanel(e.id, 'EFECTIVO')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${edificioExpandido === e.id && metodoSeleccionado === 'EFECTIVO' ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                  >
                    💵 EFECTIVO
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Comprobantes del mes</h3>
                {cargandoComprobantes && <span className="text-xs text-slate-500">Cargando...</span>}
              </div>
              {(comprobantesPorEdificio[e.id] || []).length === 0 ? (
                <p className="text-xs text-slate-500">No hay comprobantes cargados para este mes.</p>
              ) : (
                <div className="space-y-2">
                  {(comprobantesPorEdificio[e.id] || []).map((comprobante) => (
                    <div key={comprobante.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{comprobante.type}</p>
                        <p className="text-xs text-slate-500">
                          ${Number(comprobante.amount || 0).toLocaleString('es-AR')} · {new Date(comprobante.date).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      {comprobante.receiptUrl && (
                        <a
                          href={toApiUrl(comprobante.receiptUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- PANELES DESPLEGABLES --- */}
            {edificioExpandido === e.id && (
              <div className="bg-gray-50 border-t p-6 animate-in slide-in-from-top-2 duration-300">
                
                {/* FORMULARIO EFECTIVO (El que estaba bien) */}
                {metodoSeleccionado === 'EFECTIVO' && (
                  <div className="max-w-md mx-auto">
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg mb-4 text-sm font-medium">
                      Aviso: El pago quedará pendiente hasta que el dueño reciba el dinero.
                    </div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mensaje para el administrador</label>
                    <textarea 
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-400 mb-4"
                      rows={3}
                      placeholder="Ej: Paso mañana después de las 18hs..."
                      value={notaEfectivo}
                      onChange={(ev) => setNotaEfectivo(ev.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEdificioExpandido(null)} className="flex-1 py-2 font-bold text-gray-500">Cancelar</button>
                      <button className="flex-2 bg-orange-600 text-white py-2 px-6 rounded-xl font-bold">Confirmar Aviso</button>
                    </div>
                  </div>
                )}

                {/* FORMULARIO TARJETA (Con Validaciones) */}
                {metodoSeleccionado === 'TARJETA' && (
                  <form onSubmit={(ev) => { ev.preventDefault(); if(validarTarjeta()) alert("Procesando..."); }} className="max-w-md mx-auto space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <input 
                          type="text" placeholder="Número de Tarjeta (16 dígitos)"
                          className={`w-full p-3 border rounded-xl outline-none ${errores.numero ? 'border-red-500 ring-1 ring-red-100' : 'focus:ring-2 focus:ring-blue-400'}`}
                          value={datosTarjeta.numero}
                          onChange={(ev) => setDatosTarjeta({...datosTarjeta, numero: ev.target.value})}
                        />
                        {errores.numero && <p className="text-red-500 text-[10px] mt-1 font-bold">{errores.numero}</p>}
                      </div>
                      <input 
                        type="text" placeholder="Nombre completo como figura"
                        className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
                        value={datosTarjeta.nombre}
                        onChange={(ev) => setDatosTarjeta({...datosTarjeta, nombre: ev.target.value.toUpperCase()})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" placeholder="MM/AA"
                          className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
                          value={datosTarjeta.vencimiento}
                          onChange={(ev) => setDatosTarjeta({...datosTarjeta, vencimiento: ev.target.value})}
                        />
                        <input 
                          type="text" placeholder="CVC"
                          className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
                          value={datosTarjeta.cvc}
                          onChange={(ev) => setDatosTarjeta({...datosTarjeta, cvc: ev.target.value})}
                        />
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-extrabold shadow-lg shadow-blue-200">
                      CONFIRMAR PAGO
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}