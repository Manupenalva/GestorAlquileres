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
        <div className="grid gap-4">
          {edificios.map((e) => (
            <div
              key={e.id}
              className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Información del Edificio (Izquierda) */}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{e.nombre}</h2>
                {e.direccion && (
                  <p className="text-sm text-gray-500 mt-1">{e.direccion}</p>
                )}
              </div>

              {/* Botón de Acción (Derecha) */}
              <button
                onClick={() => navigate(`/login`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Pagar Expensas
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}