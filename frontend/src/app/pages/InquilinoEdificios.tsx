import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

type Edificio = {
  id: number;
  nombre: string;
  direccion?: string;
};

export default function InquilinoEdificios() {
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEdificios = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/edificio/mis-edificios`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setEdificios(data);
      } catch (error) {
        console.error("Error cargando edificios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEdificios();
  }, []);

  if (loading) return <p className="p-4">Cargando edificios...</p>;

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