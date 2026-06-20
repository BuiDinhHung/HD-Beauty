import { Timestamp } from 'firebase/firestore';

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'staff';

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  address?: string;
  phone?: string;
  openingHours?: string;
}

export interface User {
  id: string;
  shopId: string;
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  photoURL?: string;
  encryptedPassword?: string;
  createdAt: Timestamp;
}

export interface Service {
  id: string;
  shopId: string;
  name: string;
  price: number;
  active: boolean;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  shopId: string;
  staffId: string;
  staffName: string;
  customerName: string;
  customerPhone: string;
  serviceIds: string[];
  serviceNames: string[];
  suggestedAmount: number;
  discount: number;
  totalAmount: number;
  note: string;
  createdAt: Timestamp;
}

export interface StaffReport {
  staffId: string;
  staffName: string;
  customerCount: number;
  totalRevenue: number;
  avgRevenue: number;
}

export interface ServiceReport {
  serviceId: string;
  serviceName: string;
  usageCount: number;
  totalRevenue: number;
}

export interface DashboardStats {
  todayRevenue: number;
  monthRevenue: number;
  todayCustomers: number;
  monthCustomers: number;
  topStaff: StaffReport | null;
  topService: ServiceReport | null;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  customers: number;
}

export interface TransactionFormData {
  customerName: string;
  customerPhone?: string;
  serviceIds: string[];
  serviceNames?: string[];
  suggestedAmount: number;
  discount: number;
  totalAmount: number;
  note: string;
}

export interface StaffFormData {
  name: string;
  phone: string;
  email: string;
  password?: string;
}

export interface ServiceFormData {
  name: string;
  price: number;
  active: boolean;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  staffId: string;
  serviceId: string;
  search: string;
}
