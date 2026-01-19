/**
 * Repository interfaces
 * Following Repository pattern and Dependency Inversion Principle
 */

import { ICustomer } from '../entities/Customer';
import { IShipmentData } from '../entities/Shipment';
import { ShipmentStatusType } from '../entities/ShipmentStatus';

export interface ICustomerRepository {
  create(customer: ICustomer): Promise<ICustomer>;
  findById(id: string): Promise<ICustomer | null>;
  findByEmail(email: string): Promise<ICustomer | null>;
  findByDocument(documentNumber: string): Promise<ICustomer | null>;
  update(id: string, customer: Partial<ICustomer>): Promise<ICustomer | null>;
  delete(id: string): Promise<boolean>;
  findAll(page?: number, limit?: number): Promise<ICustomer[]>;
}

export interface IShipmentRepository {
  create(shipment: IShipmentData): Promise<IShipmentData>;
  findById(id: string): Promise<IShipmentData | null>;
  findByTrackingNumber(trackingNumber: string): Promise<IShipmentData | null>;
  findByCustomer(customerId: string, page?: number, limit?: number): Promise<IShipmentData[]>;
  findByStatus(status: ShipmentStatusType, page?: number, limit?: number): Promise<IShipmentData[]>;
  findAll(page?: number, limit?: number): Promise<IShipmentData[]>;
  update(id: string, shipment: Partial<IShipmentData>): Promise<IShipmentData | null>;
  updateStatus(id: string, status: ShipmentStatusType, notes?: string): Promise<IShipmentData | null>;
  delete(id: string): Promise<boolean>;
  search(query: string, page?: number, limit?: number): Promise<IShipmentData[]>;
  count(): Promise<number>;
  countByStatus(status: ShipmentStatusType): Promise<number>;
}
