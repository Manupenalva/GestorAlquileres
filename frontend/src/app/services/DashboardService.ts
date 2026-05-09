import { Building, Tenant, Expense, Payment } from '../types';

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  occupancyRate: number;
  totalUnits: number;
  occupiedUnits: number;
  monthlyTrends: {
    month: string;
    revenue: number;
    expenses: number;
  }[];
  expensesByType: {
    type: string;
    amount: number;
  }[];
}

class DashboardService {
  public aggregatePortfolioData(
    buildings: Building[],
    tenants: Tenant[],
    expenses: Expense[],
    payments: Payment[]
  ): DashboardMetrics {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // 1. Calculate Occupancy
    const totalUnits = buildings.reduce((sum, b) => sum + (b.cantidadDepartamentos || 0), 0);
    const occupiedUnits = tenants.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // 2. Calculate Financials (All Time or Current Period - let's do All Time for global, or filtered by year)
    // For a dashboard, let's focus on the Current Year Trends
    const totalRevenue = payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // 3. Expenses by Type
    const expensesByTypeMap = expenses.reduce((acc, exp) => {
      acc[exp.type] = (acc[exp.type] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const expensesByType = Object.entries(expensesByTypeMap).map(([type, amount]) => ({
      type,
      amount,
    }));

    // 4. Monthly Trends (Last 12 months)
    const monthlyTrends = this.calculateMonthlyTrends(payments, expenses, currentYear);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      occupancyRate,
      totalUnits,
      occupiedUnits,
      monthlyTrends,
      expensesByType,
    };
  }

  private calculateMonthlyTrends(payments: Payment[], expenses: Expense[], year: number) {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    return months.map((name, i) => {
      const monthStr = (i + 1).toString().padStart(2, '0');
      
      const monthlyRevenue = payments
        .filter(p => p.isPaid && p.month === `${year}-${monthStr}`)
        .reduce((sum, p) => sum + p.amount, 0);

      const monthlyExpenses = expenses
        .filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === year && (d.getMonth() + 1).toString().padStart(2, '0') === monthStr;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month: name,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
      };
    });
  }
}

export const dashboardService = new DashboardService();
