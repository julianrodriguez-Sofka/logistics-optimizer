/**
 * Shipment Repository Implementation
 * Complex aggregate repository with advanced querying capabilities
 * Following Repository Pattern and Interface Segregation Principle
 */

import { IShipmentRepository } from '../../../domain/interfaces/IRepositories';
import { IShipmentData } from '../../../domain/entities/Shipment';
import { ShipmentStatusType } from '../../../domain/entities/ShipmentStatus';
import { ShipmentModel } from '../schemas/ShipmentSchema';
import { Logger } from '../../logging/Logger';

export class ShipmentRepository implements IShipmentRepository {
  private logger = Logger.getInstance();

  /**
   * Create a new shipment
   */
  async create(shipment: IShipmentData): Promise<IShipmentData> {
    try {
      const newShipment = new ShipmentModel(shipment);
      const saved = await newShipment.save();
      await saved.populate('customer');
      
      this.logger.info('Shipment created', { 
        shipmentId: saved.id,
        trackingNumber: saved.trackingNumber 
      });
      
      return saved.toJSON();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Tracking number already exists');
      }
      this.logger.error('Error creating shipment', { error: error.message });
      throw error;
    }
  }

  /**
   * Find shipment by ID with customer populated
   */
  async findById(id: string): Promise<IShipmentData | null> {
    try {
      const shipment = await ShipmentModel.findById(id).populate('customer');
      return shipment ? shipment.toJSON() : null;
    } catch (error: any) {
      this.logger.error('Error finding shipment by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find shipment by tracking number
   */
  async findByTrackingNumber(trackingNumber: string): Promise<IShipmentData | null> {
    try {
      const shipment = await ShipmentModel.findOne({ trackingNumber }).populate('customer');
      return shipment ? shipment.toJSON() : null;
    } catch (error: any) {
      this.logger.error('Error finding shipment by tracking number', { 
        trackingNumber, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Find shipments by customer ID
   */
  async findByCustomer(
    customerId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<IShipmentData[]> {
    try {
      const skip = (page - 1) * limit;
      const shipments = await ShipmentModel.find({ customer: customerId })
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return shipments.map(s => s.toJSON());
    } catch (error: any) {
      this.logger.error('Error finding shipments by customer', { 
        customerId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Find shipments by status
   */
  async findByStatus(
    status: ShipmentStatusType, 
    page: number = 1, 
    limit: number = 20
  ): Promise<IShipmentData[]> {
    try {
      const skip = (page - 1) * limit;
      const shipments = await ShipmentModel.find({ currentStatus: status })
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return shipments.map(s => s.toJSON());
    } catch (error: any) {
      this.logger.error('Error finding shipments by status', { 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Find all shipments with pagination
   */
  async findAll(page: number = 1, limit: number = 20): Promise<IShipmentData[]> {
    try {
      const skip = (page - 1) * limit;
      const shipments = await ShipmentModel.find()
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return shipments.map(s => s.toJSON());
    } catch (error: any) {
      this.logger.error('Error finding all shipments', { error: error.message });
      throw error;
    }
  }

  /**
   * Update shipment
   */
  async update(id: string, shipmentData: Partial<IShipmentData>): Promise<IShipmentData | null> {
    try {
      const shipment = await ShipmentModel.findByIdAndUpdate(
        id,
        { $set: shipmentData },
        { new: true, runValidators: true }
      ).populate('customer');

      if (shipment) {
        this.logger.info('Shipment updated', { shipmentId: id });
        return shipment.toJSON();
      }
      return null;
    } catch (error: any) {
      this.logger.error('Error updating shipment', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Update shipment status with history tracking
   */
  async updateStatus(
    id: string, 
    status: ShipmentStatusType, 
    notes?: string
  ): Promise<IShipmentData | null> {
    try {
      const shipment = await ShipmentModel.findById(id);
      
      if (!shipment) {
        return null;
      }

      // Add current status to history
      shipment.statusHistory.push({
        status: shipment.currentStatus,
        timestamp: new Date(),
        notes,
      });

      // Update current status
      shipment.currentStatus = status;

      // If delivered, set actual delivery date
      if (status === 'DELIVERED') {
        shipment.actualDeliveryDate = new Date();
      }

      await shipment.save();
      await shipment.populate('customer');

      this.logger.info('Shipment status updated', { 
        shipmentId: id, 
        newStatus: status 
      });

      return shipment.toJSON();
    } catch (error: any) {
      this.logger.error('Error updating shipment status', { 
        id, 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete shipment
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await ShipmentModel.findByIdAndDelete(id);
      if (result) {
        this.logger.info('Shipment deleted', { shipmentId: id });
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.error('Error deleting shipment', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Search shipments by tracking number, origin, or destination
   */
  async search(query: string, page: number = 1, limit: number = 20): Promise<IShipmentData[]> {
    try {
      const skip = (page - 1) * limit;
      
      const shipments = await ShipmentModel.find({
        $text: { $search: query }
      })
        .populate('customer')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);

      return shipments.map(s => s.toJSON());
    } catch (error: any) {
      this.logger.error('Error searching shipments', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Count total shipments
   */
  async count(): Promise<number> {
    try {
      return await ShipmentModel.countDocuments();
    } catch (error: any) {
      this.logger.error('Error counting shipments', { error: error.message });
      throw error;
    }
  }

  /**
   * Count shipments by status
   */
  async countByStatus(status: ShipmentStatusType): Promise<number> {
    try {
      return await ShipmentModel.countDocuments({ currentStatus: status });
    } catch (error: any) {
      this.logger.error('Error counting shipments by status', { 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get shipments with delayed deliveries
   */
  async findDelayed(page: number = 1, limit: number = 20): Promise<IShipmentData[]> {
    try {
      const skip = (page - 1) * limit;
      const now = new Date();

      const shipments = await ShipmentModel.find({
        estimatedDeliveryDate: { $lt: now },
        actualDeliveryDate: { $exists: false },
        currentStatus: { 
          $nin: ['DELIVERED', 'CANCELLED', 'RETURNED'] 
        }
      })
        .populate('customer')
        .sort({ estimatedDeliveryDate: 1 })
        .skip(skip)
        .limit(limit);

      return shipments.map(s => s.toJSON());
    } catch (error: any) {
      this.logger.error('Error finding delayed shipments', { error: error.message });
      throw error;
    }
  }

  /**
   * Get shipments statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<ShipmentStatusType, number>;
    delayed: number;
    delivered: number;
  }> {
    try {
      const total = await this.count();
      const delayed = (await this.findDelayed(1, 1000)).length;
      const delivered = await this.countByStatus('DELIVERED');

      const statuses: ShipmentStatusType[] = [
        'PENDING_PAYMENT',
        'PAYMENT_CONFIRMED',
        'PROCESSING',
        'READY_FOR_PICKUP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED_DELIVERY',
        'CANCELLED',
        'RETURNED',
      ];

      const byStatus: Record<string, number> = {};
      for (const status of statuses) {
        byStatus[status] = await this.countByStatus(status);
      }

      return {
        total,
        byStatus: byStatus as Record<ShipmentStatusType, number>,
        delayed,
        delivered,
      };
    } catch (error: any) {
      this.logger.error('Error getting shipment statistics', { error: error.message });
      throw error;
    }
  }
}
