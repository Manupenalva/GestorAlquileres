export interface Building {
  id: number;
  nombre: string;
  direccion: string;
  propietario?: UserSummary;
  cantidadDepartamentos: number;
  cantidadInquilinos: number;
  expensasBase: number;
}

export interface UserSummary {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface Tenant {
  id: string;
  buildingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  floor: string;
  apartmentNumber: string;
  contractExpirationDate: string;
  paymentDayOfMonth: number;
  rentAmount: number;
}

export interface Expense {
  id: string;
  buildingId: string;
  type: string;
  amount: number;
  description: string;
  date: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  buildingId: string;
  amount: number;
  month: string; // formato: "YYYY-MM"
  date: string;
  isPaid: boolean;
}
