import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { History, ArrowLeft, CreditCard, Banknote, Calendar, Building2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
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

type DeudaResponse = {
  id: number;
  edificioId?: number;
  tipo: 'ALQUILER' | 'EXPENSAS_BASE' | 'GASTOS_EXTRA' | string;
  periodo: string;
  montoOriginal: number;
  montoPagado: number;
  montoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | string;
  descripcion?: string;
};

type DeudaResumenPorEdificio = {
  ALQUILER: number;
  EXPENSAS_BASE: number;
  GASTOS_EXTRA: number;
  total: number;
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
  const [deudasPorEdificio, setDeudasPorEdificio] = useState<Record<number, number>>({});
  const [deudasDetallePorEdificio, setDeudasDetallePorEdificio] = useState<Record<number, DeudaResumenPorEdificio>>({});
  const [deudaPendienteTotal, setDeudaPendienteTotal] = useState(0);

  const [notaEfectivo, setNotaEfectivo] = useState("");
  const [datosTarjeta, setDatosTarjeta] = useState({ numero: "", nombre: "", vencimiento: "", cvc: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null); // Nuevo estado
  const [pagoResultado, setPagoResultado] = useState<{ edificioId: number; estado: 'PAGADO' | 'PENDIENTE'; mensaje: string } | null>(null);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [historialContratos, setHistorialContratos] = useState<any[]>([]);
  const [verHistorial, setVerHistorial] = useState(false);
  // Selección de monto a pagar al abrir el panel
  const [montoSeleccionTipo, setMontoSeleccionTipo] = useState<'TOTAL' | 'DEUDA' | 'OTRO'>('TOTAL');
  const [montoCustom, setMontoCustom] = useState('');

  useEffect(() => {
    if (verHistorial) {
      const fetchHistorial = async () => {
        const token = localStorage.getItem("auth_token");
        try {
          const [pagosRes, contratosRes] = await Promise.all([
            fetch(`${API_BASE}/api/pagos/mis-pagos`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_BASE}/api/pagos/mis-contratos`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          if (pagosRes.ok) setHistorialPagos(await pagosRes.json());
          if (contratosRes.ok) setHistorialContratos(await contratosRes.json());
        } catch (err) { console.error("Error al cargar historial", err); }
      };
      fetchHistorial();
    }
  }, [verHistorial]);

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

  useEffect(() => {
    const fetchDeudas = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token || edificios.length === 0) {
        setDeudasPorEdificio({});
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/deudas/mis-deudas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setDeudasPorEdificio({});
          return;
        }

        const deudas = (await response.json()) as DeudaResponse[];
        const totalPendiente = deudas.reduce((sum, deuda) => {
          const estado = String(deuda.estado).toUpperCase();
          if (estado !== 'PENDIENTE' && estado !== 'PARCIAL') {
            return sum;
          }
          return sum + (Number(deuda.montoPendiente) || 0);
        }, 0);

        const acumuladas = deudas.reduce((acc, deuda) => {
          if (!deuda.edificioId) {
            return acc;
          }

          const estado = String(deuda.estado).toUpperCase();
          if (estado !== 'PENDIENTE' && estado !== 'PARCIAL') {
            return acc;
          }

          acc[deuda.edificioId] = (acc[deuda.edificioId] || 0) + (Number(deuda.montoPendiente) || 0);
          return acc;
        }, {} as Record<number, number>);

        const detalladas = deudas.reduce((acc, deuda) => {
          if (!deuda.edificioId) {
            return acc;
          }

          const estado = String(deuda.estado).toUpperCase();
          if (estado !== 'PENDIENTE' && estado !== 'PARCIAL') {
            return acc;
          }

          const tipo = String(deuda.tipo).toUpperCase();
          if (!acc[deuda.edificioId]) {
            acc[deuda.edificioId] = { ALQUILER: 0, EXPENSAS_BASE: 0, GASTOS_EXTRA: 0, total: 0 };
          }

          const monto = Number(deuda.montoPendiente) || 0;
          if (tipo === 'ALQUILER') {
            acc[deuda.edificioId].ALQUILER += monto;
          } else if (tipo === 'EXPENSAS_BASE') {
            acc[deuda.edificioId].EXPENSAS_BASE += monto;
          } else if (tipo === 'GASTOS_EXTRA') {
            acc[deuda.edificioId].GASTOS_EXTRA += monto;
          }
          acc[deuda.edificioId].total += monto;
          return acc;
        }, {} as Record<number, DeudaResumenPorEdificio>);

        setDeudasPorEdificio(acumuladas);
        setDeudasDetallePorEdificio(detalladas);
        setDeudaPendienteTotal(totalPendiente);
      } catch {
        setDeudasPorEdificio({});
        setDeudasDetallePorEdificio({});
        setDeudaPendienteTotal(0);
      }
    };

    fetchDeudas();
  }, [edificios]);

  const toApiUrl = (path: string) => (path.startsWith('http') ? path : `${API_BASE}${path}`);

  const calcularDetallePago = (edificio: Edificio) => {
    const deudaDetalle = deudasDetallePorEdificio[edificio.id] || { ALQUILER: 0, EXPENSAS_BASE: 0, GASTOS_EXTRA: 0, total: 0 };
    const alquiler = deudaDetalle.ALQUILER;
    const gastoExpensas = deudaDetalle.EXPENSAS_BASE;
    const gastoExtraProrrateado = deudaDetalle.GASTOS_EXTRA;
    const totalPagar = deudaDetalle.total;

    return {
      alquiler,
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
      setErrorGeneral(null); // Limpiar errores al cambiar
      // Reset selección de monto al abrir panel
      setMontoSeleccionTipo('TOTAL');
      setMontoCustom('');
    }
  };

  const validarTarjeta = () => {
    const e: Record<string, string> = {};
    setErrorGeneral(null);
    
    // Validar Número
    if (!/^\d{16}$/.test(datosTarjeta.numero.replace(/\s/g, ""))) {
      e.numero = "16 dígitos requeridos.";
    }

    // Validar Vencimiento
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datosTarjeta.vencimiento)) {
      e.vencimiento = "Formato MM/AA requerido.";
    } else {
      const [mesStr, anioStr] = datosTarjeta.vencimiento.split('/');
      const mesIngresado = parseInt(mesStr, 10);
      const anioIngresado = parseInt(anioStr, 10);
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth() + 1;
      const anioActual = parseInt(fechaActual.getFullYear().toString().slice(-2));

      if (anioIngresado < anioActual || (anioIngresado === anioActual && mesIngresado < mesActual)) {
        e.vencimiento = "La tarjeta está vencida.";
      }
    }

    // Validar CVC
    if (!/^\d{3}$/.test(datosTarjeta.cvc)) {
      e.cvc = "3 dígitos requeridos.";
    }

    // Validar Nombre
    if (datosTarjeta.nombre.trim().length < 3) {
      e.nombre = "Ingrese el nombre del titular.";
    }

    setErrores(e);

    if (Object.keys(e).length > 0) {
      setErrorGeneral("La tarjeta no es válida. Revisa los campos marcados.");
      return false;
    }
    return true;
  };

  const confirmarPagoTarjeta = async (edificioId: number, monto: number) => {
    if (!validarTarjeta()) return;
    setProcesando(true);
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE}/api/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // IMPORTANTE: El backend debería validar esto, pero enviamos el estado deseado
        body: JSON.stringify({ edificioId, monto, metodo: "TARJETA", estado: "PAGADO" }),
      });
      setPagoResultado({ edificioId, estado: "PAGADO", mensaje: "¡Pago con tarjeta registrado exitosamente!" });
      setEdificioExpandido(null);
      setDatosTarjeta({ numero: "", nombre: "", vencimiento: "", cvc: "" });
    } catch {
      setErrorGeneral("Error de conexión al procesar el pago.");
    } finally {
      setProcesando(false);
    }
  };

  const confirmarAvisoEfectivo = async (edificioId: number, monto: number) => {
    setProcesando(true);
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE}/api/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ edificioId, monto, metodo: "EFECTIVO", estado: "PENDIENTE", nota: notaEfectivo }),
      });
      setPagoResultado({ edificioId, estado: "PENDIENTE", mensaje: "Aviso enviado. Pendiente de confirmación." });
      setEdificioExpandido(null);
      setNotaEfectivo("");
    } catch {
      setErrorGeneral("Error al enviar el aviso.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <p className="p-4 font-bold text-gray-600">Cargando edificios...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {verHistorial ? "Mi Historial" : "Mis Alquileres"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {verHistorial ? "Consulta tus contratos y pagos pasados" : "Gestiona tus unidades actuales y realiza pagos"}
          </p>
        </div>

        {!verHistorial && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deuda pendiente total</p>
            <p className="text-2xl font-black text-slate-900">${deudaPendienteTotal.toLocaleString('es-AR')}</p>
            <p className="text-[11px] font-medium text-slate-500">Incluye pendientes y parciales</p>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={verHistorial ? "outline" : "default"}
            onClick={() => setVerHistorial(!verHistorial)}
            className="rounded-xl font-bold gap-2 h-11 px-6 shadow-sm transition-all"
          >
            {verHistorial ? (
              <><ArrowLeft className="size-4" /> Volver a Alquileres</>
            ) : (
              <><History className="size-4" /> Ver Mi Historial Completo</>
            )}
          </Button>

          {!verHistorial && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mes</span>
              <input
                type="month"
                value={mesComprobantes}
                onChange={(ev) => setMesComprobantes(ev.target.value)}
                className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-700 cursor-pointer"
              />
            </div>
          )}
        </div>
      </header>

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <CardContent className="p-4 flex items-center gap-2 text-sm">
            ⚠️ {error}
          </CardContent>
        </Card>
      )}

      {verHistorial ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Building2 className="size-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Historial de Contratos</h2>
            </div>
            
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Edificio / Unidad</th>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Monto</th>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Vencimiento</th>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Periodo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historialContratos.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium italic">No hay historial de contratos registrado todavía.</td></tr>
                    ) : (
                      historialContratos.map((hc) => (
                        <tr key={hc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-gray-900">{hc.unidad?.edificio?.nombre}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">
                                {hc.unidad?.piso} {hc.unidad?.nombre}
                              </span>
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">${hc.montoAlquiler.toLocaleString('es-AR')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="font-medium bg-white">
                              <Calendar className="size-3 mr-1 text-gray-400" />
                              {hc.vencimientoContrato || "No especificado"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-semibold text-gray-600 bg-slate-100 inline-flex px-3 py-1 rounded-full">
                              {new Date(hc.fechaInicio).toLocaleDateString('es-AR')} → {hc.fechaFin ? new Date(hc.fechaFin).toLocaleDateString('es-AR') : <span className="text-green-600 ml-1">Vigente</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <CreditCard className="size-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Historial de Pagos</h2>
            </div>

            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Fecha y Edificio</th>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Monto</th>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Método</th>
                      <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historialPagos.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">No se han realizado pagos todavía.</td></tr>
                    ) : (
                      historialPagos.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{p.unidad?.edificio?.nombre}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                              {new Date(p.fechaPago).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-lg font-black text-gray-900">${p.monto.toLocaleString('es-AR')}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              {p.metodo === 'TARJETA' ? <CreditCard className="size-4" /> : <Banknote className="size-4" />}
                              <span className="text-xs font-bold">{p.metodo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${p.estado === 'PAGADO' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200' : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200'}`} variant="outline">
                              {p.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </div>
      ) : (
        <div className="grid gap-6">
        {edificios.map((e) => {
          const detallePago = calcularDetallePago(e);

          return (
          <div key={e.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden border-gray-200">
            
            <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
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

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-3 min-w-[240px]">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total a Pagar</p>
                  <p className="text-3xl font-black text-slate-900">
                    ${detallePago.totalPagar.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alquiler ${detallePago.alquiler.toLocaleString('es-AR')} + Expensas ${detallePago.gastoExpensas.toLocaleString('es-AR')} + Deuda ${detallePago.gastoExtraProrrateado.toLocaleString('es-AR')}
                  </p>
                  <p className="text-3xl font-black text-slate-900">${(e.expensasBase || 0).toLocaleString('es-AR')}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    Deuda pendiente: ${Math.max(0, deudasPorEdificio[e.id] || 0).toLocaleString('es-AR')}
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
                
                {metodoSeleccionado === 'EFECTIVO' && (
                  <div className="max-w-md mx-auto">
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg mb-4 text-sm font-medium border border-orange-200">
                      Aviso: El pago quedará <strong>PENDIENTE</strong> hasta que el dueño reciba el dinero.
                    </div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mensaje para el administrador</label>
                    <textarea 
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-400 mb-4"
                      rows={3}
                      placeholder="Ej: Paso mañana a dejar el dinero..."
                      value={notaEfectivo}
                      onChange={(ev) => setNotaEfectivo(ev.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEdificioExpandido(null)} className="flex-1 py-2 font-bold text-gray-500">Cancelar</button>
                      <button onClick={() => {
                          const montoAEnviar = montoSeleccionTipo === 'TOTAL' ? detallePago.totalPagar : montoSeleccionTipo === 'DEUDA' ? Math.max(0, deudasPorEdificio[e.id] || 0) : Number(parseFloat(montoCustom) || 0);
                          confirmarAvisoEfectivo(e.id, montoAEnviar);
                        }} disabled={procesando} className="flex-2 bg-orange-600 text-white py-2 px-6 rounded-xl font-bold disabled:opacity-50">
                        {procesando ? "Enviando..." : "Confirmar Aviso"}
                      </button>
                    </div>
                  </div>
                )}

                {metodoSeleccionado === 'TARJETA' && (
                      <form onSubmit={(ev) => { ev.preventDefault();
                            const montoAEnviar = montoSeleccionTipo === 'TOTAL' ? detallePago.totalPagar : montoSeleccionTipo === 'DEUDA' ? Math.max(0, deudasPorEdificio[e.id] || 0) : Number(parseFloat(montoCustom) || 0);
                            confirmarPagoTarjeta(e.id, montoAEnviar);
                          }} className="max-w-md mx-auto space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-600">Seleccionar monto a pagar</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setMontoSeleccionTipo('TOTAL')} className={`px-3 py-1 rounded-lg text-sm font-bold ${montoSeleccionTipo === 'TOTAL' ? 'bg-blue-700 text-white' : 'bg-gray-100'}`}>
                              Total a Pagar (${detallePago.totalPagar.toLocaleString('es-AR')})
                            </button>
                            <button type="button" onClick={() => setMontoSeleccionTipo('DEUDA')} className={`px-3 py-1 rounded-lg text-sm font-bold ${montoSeleccionTipo === 'DEUDA' ? 'bg-blue-700 text-white' : 'bg-gray-100'}`}>
                              Deuda pendiente (${Math.max(0, deudasPorEdificio[e.id] || 0).toLocaleString('es-AR')})
                            </button>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setMontoSeleccionTipo('OTRO')} className={`px-3 py-1 rounded-lg text-sm font-bold ${montoSeleccionTipo === 'OTRO' ? 'bg-blue-700 text-white' : 'bg-gray-100'}`}>
                                Otro monto
                              </button>
                              {montoSeleccionTipo === 'OTRO' && (
                                <input type="number" step="0.01" min="0" value={montoCustom} onChange={(ev) => setMontoCustom(ev.target.value)} placeholder="0.00" className="w-28 p-2 border rounded-xl" />
                              )}
                            </div>
                          </div>
                        </div>
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
                      
                      <div>
                        <input 
                          type="text" placeholder="Nombre del Titular"
                          className={`w-full p-3 border rounded-xl outline-none ${errores.nombre ? 'border-red-500 ring-1 ring-red-100' : 'focus:ring-2 focus:ring-blue-400'}`}
                          value={datosTarjeta.nombre}
                          onChange={(ev) => setDatosTarjeta({...datosTarjeta, nombre: ev.target.value.toUpperCase()})}
                        />
                        {errores.nombre && <p className="text-red-500 text-[10px] mt-1 font-bold">{errores.nombre}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input 
                            type="text" placeholder="MM/AA"
                            className={`w-full p-3 border rounded-xl outline-none ${errores.vencimiento ? 'border-red-500 ring-1 ring-red-100' : 'focus:ring-2 focus:ring-blue-400'}`}
                            value={datosTarjeta.vencimiento}
                            onChange={(ev) => setDatosTarjeta({...datosTarjeta, vencimiento: ev.target.value})}
                          />
                          {errores.vencimiento && <p className="text-red-500 text-[10px] mt-1 font-bold">{errores.vencimiento}</p>}
                        </div>
                        <div>
                          <input 
                            type="text" placeholder="CVC"
                            className={`w-full p-3 border rounded-xl outline-none ${errores.cvc ? 'border-red-500 ring-1 ring-red-100' : 'focus:ring-2 focus:ring-blue-400'}`}
                            value={datosTarjeta.cvc}
                            onChange={(ev) => setDatosTarjeta({...datosTarjeta, cvc: ev.target.value})}
                          />
                          {errores.cvc && <p className="text-red-500 text-[10px] mt-1 font-bold">{errores.cvc}</p>}
                        </div>
                      </div>
                    </div>

                    {errorGeneral && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100">
                        ⚠️ {errorGeneral}
                      </div>
                    )}

                    <button type="submit" disabled={procesando || (montoSeleccionTipo === 'OTRO' && (Number(parseFloat(montoCustom) || 0) <= 0))} className="w-full bg-blue-600 text-white py-3 rounded-xl font-extrabold shadow-lg shadow-blue-200 disabled:opacity-50 transition-transform active:scale-95">
                      {procesando ? "Procesando..." : "CONFIRMAR PAGO"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {pagoResultado?.edificioId === e.id && (
              <div className={`border-t px-6 py-4 flex items-center justify-between gap-4 ${pagoResultado.estado === 'PAGADO' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pagoResultado.estado === 'PAGADO' ? '✅' : '⏳'}</span>
                  <div>
                    <p className={`font-extrabold text-sm ${pagoResultado.estado === 'PAGADO' ? 'text-green-800' : 'text-yellow-800'}`}>
                      Estado: {pagoResultado.estado}
                    </p>
                    <p className={`text-xs ${pagoResultado.estado === 'PAGADO' ? 'text-green-700' : 'text-yellow-700'}`}>
                      {pagoResultado.mensaje}
                    </p>
                  </div>
                </div>
                <button onClick={() => setPagoResultado(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
              </div>
            )}
          </div>
        )})}
      </div>
    )}
    </div>
  );
}