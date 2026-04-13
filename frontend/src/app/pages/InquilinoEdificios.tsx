import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

type Edificio = {
  id: number;
  nombre: string;
  direccion?: string;
};

export default function InquilinoEdificios() {
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- MVP: Monto hardcodeado por ahora ---
  const montoHardcodeado = 150000;

  useEffect(() => {
    const fetchEdificios = async () => {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("No estás autenticado. Por favor, iniciá sesión.");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/edificios/mis-edificios`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          setError("Tu sesión expiró o el token es inválido.");
          localStorage.removeItem("auth_token");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error(`Error del servidor: ${res.status}`);
        }

        const data = await res.json();
        setEdificios(data);
      } catch (error) {
        console.error("Error cargando edificios:", error);
        setError("Hubo un problema de red al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchEdificios();
  }, [navigate]);

  // Funciones simuladas para los botones
  const handlePagoTarjeta = (edificioNombre: string) => {
    // Acá luego abrirás el modal o harás el fetch
    alert(`Abriendo formulario de pago con TARJETA para: ${edificioNombre}\nMonto: $${montoHardcodeado}`);
  };

  const handlePagoEfectivo = (edificioNombre: string) => {
    // Acá harás el fetch para pasarlo a PENDIENTE
    alert(`Avisando al administrador que pagarás en EFECTIVO el alquiler de: ${edificioNombre}`);
  };

  if (loading) return <p className="p-4">Cargando edificios...</p>;

  if (error) return <div className="p-4 text-red-500 font-semibold">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mis Alquileres</h1>

      {edificios.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-xl p-8 text-center text-gray-500">
          <p>No tenés departamentos o edificios asignados todavía.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {edificios.map((e) => (
            <div
              key={e.id}
              className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              {/* Información del Edificio (Izquierda) */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{e.nombre}</h2>
                {e.direccion && (
                  <p className="text-sm text-gray-500 mt-1">{e.direccion}</p>
                )}
              </div>

              {/* Sección de Pago (Derecha) */}
              <div className="flex flex-col items-start sm:items-end gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                
                {/* Monto a pagar */}
                <div className="text-right w-full">
                  <span className="text-sm text-gray-500 font-medium mr-2">Total a pagar:</span>
                  <span className="text-2xl font-black text-gray-900">
                    ${montoHardcodeado.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handlePagoTarjeta(e.nombre)}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    💳 Tarjeta
                  </button>
                  
                  <button
                    onClick={() => handlePagoEfectivo(e.nombre)}
                    className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    💵 Efectivo
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}