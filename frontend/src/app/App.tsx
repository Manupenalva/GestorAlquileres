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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [payments, setPayments] = useState<Payment[]>([]);

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
      
      loadAllTenants();
      loadAllPayments();
    } finally {
      setBuildingsLoading(false);
    }
  };

  const loadAllTenants = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/unidades`);
      if (response.ok) {
        const units = await response.json();
        const allTenants: Tenant[] = units
          .filter((unit: any) => unit.inquilino)
          .map((unit: any) => ({
            id: String(unit.id),
            buildingId: unit.edificio ? String(unit.edificio.id) : '',
            firstName: unit.inquilino.nombre,
            lastName: '',
            email: unit.inquilino.email,
            phone: '',
            floor: unit.piso || '',
            apartmentNumber: unit.nombre || '',
            contractExpirationDate: unit.vencimientoContrato || '',
            paymentDayOfMonth: unit.diaPago || 10,
            rentAmount: unit.montoAlquiler || 0,
          }));
        setTenants(allTenants);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadAllPayments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/pagos`);
      if (response.ok) {
        const contratos = await response.json();
        const backendPayments: Payment[] = contratos.map((c: any) => ({
          id: String(c.id),
          tenantId: String(c.unidad?.id ?? ''),
          buildingId: String(c.unidad?.edificio?.id ?? ''),
          amount: c.monto,
          month: c.fechaPago ? c.fechaPago.slice(0, 7) : '',
          date: c.fechaPago ?? '',
          isPaid: c.estado === 'PAGADO',
        }));
        setPayments(backendPayments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
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

  const handleDeleteBuilding = async (buildingId: number) => {
    const response = await fetch(`${API_BASE}/api/edificios/${buildingId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('No se pudo eliminar el edificio');
    }

    const buildingIdAsString = String(buildingId);
    setBuildings((currentBuildings: Building[]) =>
      currentBuildings.filter((building: Building) => building.id !== buildingId),
    );
    setTenants((currentTenants: Tenant[]) =>
      currentTenants.filter((tenant: Tenant) => tenant.buildingId !== buildingIdAsString),
    );
    setExpenses((currentExpenses: Expense[]) =>
      currentExpenses.filter((expense: Expense) => expense.buildingId !== buildingIdAsString),
    );
    setPayments((currentPayments: Payment[]) =>
      currentPayments.filter((payment: Payment) => payment.buildingId !== buildingIdAsString),
    );

    loadBuildings().catch((error) => {
      console.error(error);
    });
  };

  const handleAddTenant = async (tenantData: Omit<Tenant, 'id'>) => {
    const response = await fetch(`${API_BASE}/api/unidades/asignar-por-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        edificioId: Number(tenantData.buildingId),
        piso: tenantData.floor,
        nombre: tenantData.apartmentNumber,
        email: tenantData.email,
        montoAlquiler: tenantData.rentAmount,
        diaPago: tenantData.paymentDayOfMonth,
        vencimientoContrato: tenantData.contractExpirationDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo agregar el inquilino');
    }

    await loadBuildings();
  };

  const handleRemoveTenant = async (tenantId: string) => {
    const response = await fetch(`${API_BASE}/api/unidades/${tenantId}/inquilino`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('No se pudo eliminar el inquilino');
    }

    await loadBuildings();
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setExpenses([...expenses, newExpense]);
  };

  const handleRegisterPayment = async (paymentData: Omit<Payment, 'id' | 'date'>) => {
    // Buscar el contrato PENDIENTE de este inquilino para confirmarlo en el backend
    const pagosRes = await fetch(`${API_BASE}/api/pagos/edificio/${paymentData.buildingId}`);
    if (!pagosRes.ok) {
      throw new Error('No se pudieron obtener los pagos del edificio');
    }
    const pagos = await pagosRes.json();
    const contratoPendiente = pagos.find(
      (p: any) =>
        p.estado === 'PENDIENTE' &&
        String(p.unidad?.id) === paymentData.tenantId,
    );

    if (!contratoPendiente) {
      throw new Error('No se encontró un pago pendiente para este inquilino');
    }

    const confirmRes = await fetch(`${API_BASE}/api/pagos/${contratoPendiente.id}/confirmar`, {
      method: 'PATCH',
    });
    if (!confirmRes.ok) {
      throw new Error('No se pudo confirmar el pago en el servidor');
    }

    // Recargar todos los pagos desde el backend para reflejar el nuevo estado
    await loadAllPayments();
  };

  const router = createRouter({
    buildings,
    buildingsLoading,
    tenants,
    expenses,
    payments,
    onAddBuilding: handleAddBuilding,
    onDeleteBuilding: handleDeleteBuilding,
    onAddTenant: handleAddTenant,
    onRemoveTenant: handleRemoveTenant,
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