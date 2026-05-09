import React, { createContext, useContext, useMemo, useState } from 'react';
import { Building, Tenant, Expense, Payment } from '../types';
import { dashboardService, DashboardMetrics } from '../services/DashboardService';

interface DashboardContextType {
  metrics: DashboardMetrics;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{
  children: React.ReactNode;
  buildings: Building[];
  tenants: Tenant[];
  expenses: Expense[];
  payments: Payment[];
}> = ({ children, buildings, tenants, expenses, payments }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const metrics = useMemo(() => {
    return dashboardService.aggregatePortfolioData(buildings, tenants, expenses, payments);
  }, [buildings, tenants, expenses, payments]);

  return (
    <DashboardContext.Provider value={{ metrics, isExpanded, setIsExpanded }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
