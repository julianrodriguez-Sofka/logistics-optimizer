import axios from 'axios';
import type { AxiosError } from 'axios';
import type { 
  Shipment, 
  CreateShipmentDTO, 
  ShipmentStatistics, 
  ShipmentFilters,
  ShipmentStatusType 
} from '../models/Shipment';
import type { Customer } from '../models/Customer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Response wrapper interfaces
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Error handling helper
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    const message = axiosError.response?.data?.error 
      || axiosError.response?.data?.message 
      || axiosError.message 
      || 'Error desconocido';
    throw new Error(message);
  }
  throw error;
};

// Transform frontend data to backend format
const transformShipmentData = (data: CreateShipmentDTO) => {
  // Construct full address strings
  const originAddress = data.origin.address 
    ? `${data.origin.address}, ${data.origin.city}${data.origin.postalCode ? `, ${data.origin.postalCode}` : ''}` 
    : data.origin.city;
  const destinationAddress = data.destination.address 
    ? `${data.destination.address}, ${data.destination.city}${data.destination.postalCode ? `, ${data.destination.postalCode}` : ''}` 
    : data.destination.city;

  return {
    customer: {
      name: data.customer.name,
      email: data.customer.email,
      phone: data.customer.phone,
      documentType: data.customer.documentType,
      documentNumber: data.customer.documentNumber,
    },
    address: {
      origin: originAddress,
      destination: destinationAddress,
      originCoordinates: data.origin.coordinates,
      destinationCoordinates: data.destination.coordinates,
    },
    package: {
      weight: data.package.weight,
      dimensions: {
        length: data.package.length,
        width: data.package.width,
        height: data.package.height,
      },
      fragile: data.package.isFragile,
      description: data.package.description || 'Paquete estándar',
    },
    selectedQuote: data.selectedQuote,
    pickupDate: data.pickupDate,
    paymentRequest: {
      method: data.payment.method,
      amount: data.payment.amount,
      currency: 'COP', // Colombian Peso as default currency
      ...(data.payment.method === 'CARD' && {
        cardNumber: data.payment.cardNumber,
        cardHolderName: data.payment.cardHolderName,
        expirationDate: data.payment.expirationDate,
        cvv: data.payment.cvv,
      }),
    },
    notes: data.notes,
  };
};

// Shipment Service
export const shipmentService = {
  /**
   * Create a new shipment
   */
  async createShipment(shipmentData: CreateShipmentDTO): Promise<Shipment> {
    try {
      const transformedData = transformShipmentData(shipmentData);
      const response = await axios.post<ApiResponse<Shipment>>(
        `${API_URL}/shipments`,
        transformedData
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get all shipments with pagination
   */
  async getShipments(filters?: ShipmentFilters): Promise<{ shipments: Shipment[]; total: number }> {
    try {
      const params = {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && { q: filters.search }),
      };

      const response = await axios.get(
        `${API_URL}/shipments`,
        { params }
      );

      // Handle nested response format: { success: true, data: { shipments: [...], pagination: {...} } }
      const responseData = response.data;
      
      // Check if data contains shipments array (nested format)
      if (responseData.data && Array.isArray(responseData.data.shipments)) {
        return {
          shipments: responseData.data.shipments,
          total: responseData.data.pagination?.total || responseData.data.shipments.length,
        };
      }
      
      // Fallback: data is directly the array
      if (Array.isArray(responseData.data)) {
        return {
          shipments: responseData.data,
          total: responseData.pagination?.total || responseData.data.length,
        };
      }

      // Last fallback: empty array
      console.warn('Unexpected shipments response format:', responseData);
      return { shipments: [], total: 0 };
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get a shipment by ID
   */
  async getShipmentById(id: string): Promise<Shipment> {
    try {
      const response = await axios.get<ApiResponse<Shipment>>(
        `${API_URL}/shipments/${id}`
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Track a shipment by tracking number (public endpoint)
   */
  async trackShipment(trackingNumber: string): Promise<Shipment> {
    try {
      const response = await axios.get<ApiResponse<Shipment>>(
        `${API_URL}/shipments/track/${trackingNumber}`
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get shipments by customer ID
   */
  async getShipmentsByCustomer(customerId: string): Promise<Shipment[]> {
    try {
      const response = await axios.get<ApiResponse<Shipment[]>>(
        `${API_URL}/shipments/customer/${customerId}`
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get shipments by status
   */
  async getShipmentsByStatus(status: ShipmentStatusType): Promise<Shipment[]> {
    try {
      const response = await axios.get<ApiResponse<Shipment[]>>(
        `${API_URL}/shipments/status/${status}`
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    id: string, 
    status: ShipmentStatusType, 
    reason?: string
  ): Promise<Shipment> {
    try {
      const response = await axios.put<ApiResponse<Shipment>>(
        `${API_URL}/shipments/${id}/status`,
        { status, reason }
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Search shipments
   */
  async searchShipments(query: string): Promise<Shipment[]> {
    try {
      const response = await axios.get<ApiResponse<Shipment[]>>(
        `${API_URL}/shipments/search`,
        { params: { q: query } }
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get shipment statistics for dashboard
   */
  async getStatistics(): Promise<ShipmentStatistics> {
    try {
      const response = await axios.get<ApiResponse<ShipmentStatistics>>(
        `${API_URL}/shipments/statistics`
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Cancel a shipment
   */
  async cancelShipment(id: string, reason: string): Promise<Shipment> {
    try {
      const response = await axios.post<ApiResponse<Shipment>>(
        `${API_URL}/shipments/${id}/cancel`,
        { reason }
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

// Customer Service
export const customerService = {
  /**
   * Create a new customer
   */
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      const response = await axios.post<ApiResponse<Customer>>(
        `${API_URL}/customers`,
        customerData
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get all customers
   */
  async getCustomers(page = 1, limit = 20): Promise<{ customers: Customer[]; total: number }> {
    try {
      const response = await axios.get<PaginatedResponse<Customer>>(
        `${API_URL}/customers`,
        { params: { page, limit } }
      );

      return {
        customers: response.data.data,
        total: response.data.pagination?.total || response.data.data.length,
      };
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    try {
      const response = await axios.get<ApiResponse<Customer>>(
        `${API_URL}/customers/${id}`
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const response = await axios.get<ApiResponse<Customer>>(
        `${API_URL}/customers/email/${encodeURIComponent(email)}`
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      handleApiError(error);
    }
  },

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const response = await axios.get<ApiResponse<Customer[]>>(
        `${API_URL}/customers/search`,
        { params: { q: query } }
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update customer
   */
  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    try {
      const response = await axios.put<ApiResponse<Customer>>(
        `${API_URL}/customers/${id}`,
        customerData
      );
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/customers/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },
};
