import { useParams, Link } from 'react-router';
import { Building, Tenant, Payment, Expense } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Percent, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';

interface MonthlyReportProps {
  buildings: Building[];
  tenants: Tenant[];
  payments: Payment[];
  expenses: Expense[];
  onAddExpense: (expense: any) => void;
}

export function MonthlyReport({ 
  buildings, 
  tenants, 
  payments, 
  expenses,
  onAddExpense 
}: MonthlyReportProps) {
  const { id } = useParams();
  const building = buildings.find(b => b.id === id);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  if (!building) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Edificio no encontrado</p>
            <Link to="/">
              <Button variant="outline" className="mt-4">Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buildingTenants = tenants.filter(t => t.buildingId === id);
  const monthPayments = payments.filter(p => p.buildingId === id && p.month === selectedMonth && p.isPaid);
  const monthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return e.buildingId === id && expenseDate.toISOString().slice(0, 7) === selectedMonth;
  });

  // Cálculos
  const totalRentIncome = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const commissionRate = 0.05; // 5% comisión
  const adminCommission = totalRentIncome * commissionRate;
  const ownerResult = totalRentIncome - totalExpenses - adminCommission;

  // Datos para gráficos
  const summaryData = [
    { name: 'Ingresos', value: totalRentIncome },
    { name: 'Gastos', value: totalExpenses },
    { name: 'Comisión', value: adminCommission },
    { name: 'Resultado', value: ownerResult },
  ];

  const expensesByType = monthExpenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.type);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.type, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/building/${id}`}>
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="size-4" />
            Volver al Edificio
          </Button>
        </Link>
        
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="mb-2">Reporte Mensual</h1>
            <p className="text-muted-foreground">{building.address}</p>
          </div>
          
          <div className="flex gap-2 items-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <AddExpenseForm 
              buildingId={building.id} 
              onAdd={onAddExpense}
              triggerButton={
                <Button variant="outline" className="gap-2">
                  <Receipt className="size-4" />
                  Agregar Gasto
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Resumen de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <TrendingUp className="size-4" />
              Ingresos Alquileres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalRentIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthPayments.length} pagos recibidos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <TrendingDown className="size-4" />
              Gastos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthExpenses.length} gastos registrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <Percent className="size-4" />
              Comisión Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${adminCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              5% sobre ingresos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
              <DollarSign className="size-4" />
              Resultado Propietario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl ${ownerResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${ownerResult.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Después de gastos y comisión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
            <CardDescription>Comparación de ingresos y egresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Monto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Gastos</CardTitle>
            <CardDescription>Gastos por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay gastos registrados este mes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalle de gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {monthExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay gastos registrados para este mes
            </div>
          ) : (
            <div className="space-y-3">
              {monthExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p>{expense.type}</p>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg">${expense.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
