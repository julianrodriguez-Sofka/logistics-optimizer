/**
 * Shipment Controller
 * Handles HTTP requests for shipment management
 * Following Controller pattern and dependency injection
 */

import { Request, Response } from 'express';
import { ShipmentService } from '../../application/services/ShipmentService';
import { ShipmentRepository } from '../database/repositories/ShipmentRepository';
import { CustomerRepository } from '../database/repositories/CustomerRepository';
import { ShipmentStatusType } from '../../domain/entities/ShipmentStatus';
import { Logger } from '../logging/Logger';

export class ShipmentController {
  private shipmentService: ShipmentService;
  private logger = Logger.getInstance();

  constructor() {
    const shipmentRepository = new ShipmentRepository();
    const customerRepository = new CustomerRepository();
    this.shipmentService = new ShipmentService(shipmentRepository, customerRepository);
  }

  /**
   * Create new shipment
   * POST /api/shipments
   */
  createShipment = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Received create shipment request', {
        origin: req.body.address?.origin,
        destination: req.body.address?.destination,
      });

      const shipment = await this.shipmentService.createShipment(req.body);

      res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: shipment,
      });
    } catch (error: any) {
      this.logger.error('Error in createShipment controller', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create shipment',
      });
    }
  };

  /**
   * Get all shipments with pagination
   * GET /api/shipments?page=1&limit=20
   */
  getAllShipments = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.shipmentService.getAllShipments(page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      this.logger.error('Error in getAllShipments controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve shipments',
      });
    }
  };

  /**
   * Get shipment by ID
   * GET /api/shipments/:id
   */
  getShipmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const shipment = await this.shipmentService.getShipmentById(id);

      if (!shipment) {
        res.status(404).json({
          success: false,
          error: 'Shipment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: shipment,
      });
    } catch (error: any) {
      this.logger.error('Error in getShipmentById controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve shipment',
      });
    }
  };

  /**
   * Get shipment by tracking number
   * GET /api/shipments/track/:trackingNumber
   */
  getShipmentByTrackingNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trackingNumber } = req.params;
      const shipment = await this.shipmentService.getShipmentByTrackingNumber(trackingNumber);

      if (!shipment) {
        res.status(404).json({
          success: false,
          error: 'Shipment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: shipment,
      });
    } catch (error: any) {
      this.logger.error('Error in getShipmentByTrackingNumber controller', { 
        error: error.message 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve shipment',
      });
    }
  };

  /**
   * Get shipments by status
   * GET /api/shipments/status/:status
   */
  getShipmentsByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const shipments = await this.shipmentService.getShipmentsByStatus(
        status as ShipmentStatusType,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: shipments,
      });
    } catch (error: any) {
      this.logger.error('Error in getShipmentsByStatus controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve shipments',
      });
    }
  };

  /**
   * Get shipments by customer
   * GET /api/shipments/customer/:customerId
   */
  getShipmentsByCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const shipments = await this.shipmentService.getShipmentsByCustomer(
        customerId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: shipments,
      });
    } catch (error: any) {
      this.logger.error('Error in getShipmentsByCustomer controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve shipments',
      });
    }
  };

  /**
   * Update shipment status
   * PUT /api/shipments/:id/status
   */
  updateShipmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
        });
        return;
      }

      const updatedShipment = await this.shipmentService.updateShipmentStatus(
        id,
        status,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        data: updatedShipment,
      });
    } catch (error: any) {
      this.logger.error('Error in updateShipmentStatus controller', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update status',
      });
    }
  };

  /**
   * Search shipments
   * GET /api/shipments/search?q=query
   */
  searchShipments = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const shipments = await this.shipmentService.searchShipments(query, page, limit);

      res.status(200).json({
        success: true,
        data: shipments,
      });
    } catch (error: any) {
      this.logger.error('Error in searchShipments controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to search shipments',
      });
    }
  };

  /**
   * Get shipment statistics
   * GET /api/shipments/statistics
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.shipmentService.getStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      this.logger.error('Error in getStatistics controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics',
      });
    }
  };

  /**
   * Cancel shipment
   * POST /api/shipments/:id/cancel
   */
  cancelShipment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Cancellation reason is required',
        });
        return;
      }

      const cancelledShipment = await this.shipmentService.cancelShipment(id, reason);

      res.status(200).json({
        success: true,
        message: 'Shipment cancelled successfully',
        data: cancelledShipment,
      });
    } catch (error: any) {
      this.logger.error('Error in cancelShipment controller', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel shipment',
      });
    }
  };
}
