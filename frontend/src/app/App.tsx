import { RouterProvider } from 'react-router';
import { createRouter } from './routes.tsx';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Building, Tenant, Expense, Payment } from './types';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [buildings, setBuildings] = useLocalStorage<Building[]>('buildings', []);
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('tenants', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);

  const handleAddBuilding = (buildingData: Omit<Building, 'id' | 'createdAt'>) => {
    const newBuilding: Building = {
      ...buildingData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setBuildings([...buildings, newBuilding]);
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