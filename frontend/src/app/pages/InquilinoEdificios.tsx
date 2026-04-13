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
        navigate("/building/1");
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
          localStorage.removeItem("token");
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
  }, []);

  if (loading) return <p className="p-4">Cargando edificios...</p>;

  if (error) return <div className="p-4 text-red-500 font-semibold">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mis Edificios</h1>

      {edificios.length === 0 ? (
        <p>No tenés edificios asignados.</p>
      ) : (
        <div className="grid gap-4">
          {edificios.map((e) => (
            <div
              key={e.id}
              className="border rounded-xl p-4 shadow hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold">{e.nombre}</h2>
              {e.direccion && (
                <p className="text-gray-500">{e.direccion}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}