export interface Designation {
  id: string;
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  employee_id?: string | null;
  designation?: Designation | null;
  roles: string[];
  permissions: string[];
}

export interface AuthCompany {
  id: string;
  code: string;
  name: string;
}

export interface LoginRequest {
  company_code: string;
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
  company: AuthCompany;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Employee {
  id: string;
  code: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  joining_date?: string | null;
  designation?: Designation | null;
}

export interface TenantEmployeeData {
  tenant: {
    company_code: string;
    company_name: string;
  };
  employees: Employee[];
}
