import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { createRouter } from './routes.tsx';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Building, Tenant, Expense, Payment, UserSummary } from './types';
import { Toaster } from './components/ui/sonner';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function getAuthUser(): UserSummary | null {
  const rawAuthUser = localStorage.getItem('auth_user');

  if (!rawAuthUser) {
    return null;
  }

  try {
    return JSON.parse(rawAuthUser) as UserSummary;
  } catch {
    return null;
  }
}

export default function App() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('tenants', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);

  const loadBuildings = async (signal?: AbortSignal) => {
    setBuildingsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/edificios`, {
        signal,
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los edificios');
      }

      const data = await response.json();
      setBuildings(Array.isArray(data) ? data : []);
    } finally {
      setBuildingsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    loadBuildings(controller.signal).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error(error);
    });

    return () => controller.abort();
  }, []);

  const handleAddBuilding = async (buildingData: Omit<Building, 'id'>) => {
    const authUser = getAuthUser();

    if (!authUser?.id) {
      throw new Error('Debes iniciar sesion para agregar un edificio');
    }

    const response = await fetch(`${API_BASE}/api/edificios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: buildingData.nombre,
        direccion: buildingData.direccion,
        cantidadDepartamentos: buildingData.cantidadDepartamentos,
        cantidadInquilinos: buildingData.cantidadInquilinos,
        expensasBase: buildingData.expensasBase,
        propietarioId: authUser.id,
      }),
    });

    if (!response.ok) {
      throw new Error('No se pudo crear el edificio');
    }

    await response.json();
    await loadBuildings();
  };

  const handleAddTenant = (tenantData: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = {
      ...tenantData,
      id: crypto.randomUUID(),
    };
    setTenants([...tenants, newTenant]);
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setExpenses([...expenses, newExpense]);
  };

  const handleRegisterPayment = (paymentData: Omit<Payment, 'id' | 'date'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setPayments([...payments, newPayment]);
  };

  const router = createRouter({
    buildings,
    buildingsLoading,
    tenants,
    expenses,
    payments,
    onAddBuilding: handleAddBuilding,
    onAddTenant: handleAddTenant,
    onAddExpense: handleAddExpense,
    onRegisterPayment: handleRegisterPayment,
  });

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}