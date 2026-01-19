/**
 * Customer Controller
 * Handles HTTP requests for customer management
 */

import { Request, Response } from 'express';
import { CustomerRepository } from '../database/repositories/CustomerRepository';
import { Customer } from '../../domain/entities/Customer';
import { Logger } from '../logging/Logger';

export class CustomerController {
  private customerRepository: CustomerRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  /**
   * Create new customer
   * POST /api/customers
   */
  createCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Received create customer request', { email: req.body.email });

      const customerEntity = new Customer(req.body);
      const customer = await this.customerRepository.create(customerEntity.toJSON());

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error: any) {
      this.logger.error('Error in createCustomer controller', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create customer',
      });
    }
  };

  /**
   * Get all customers
   * GET /api/customers?page=1&limit=20
   */
  getAllCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const customers = await this.customerRepository.findAll(page, limit);
      const total = await this.customerRepository.count();

      res.status(200).json({
        success: true,
        data: {
          customers,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      this.logger.error('Error in getAllCustomers controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve customers',
      });
    }
  };

  /**
   * Get customer by ID
   * GET /api/customers/:id
   */
  getCustomerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customer = await this.customerRepository.findById(id);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      this.logger.error('Error in getCustomerById controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve customer',
      });
    }
  };

  /**
   * Get customer by email
   * GET /api/customers/email/:email
   */
  getCustomerByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;
      const customer = await this.customerRepository.findByEmail(email);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      this.logger.error('Error in getCustomerByEmail controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve customer',
      });
    }
  };

  /**
   * Update customer
   * PUT /api/customers/:id
   */
  updateCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customer = await this.customerRepository.update(id, req.body);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error: any) {
      this.logger.error('Error in updateCustomer controller', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update customer',
      });
    }
  };

  /**
   * Delete customer
   * DELETE /api/customers/:id
   */
  deleteCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.customerRepository.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error: any) {
      this.logger.error('Error in deleteCustomer controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to delete customer',
      });
    }
  };

  /**
   * Search customers
   * GET /api/customers/search?q=query
   */
  searchCustomers = async (req: Request, res: Response): Promise<void> => {
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

      const customers = await this.customerRepository.search(query, page, limit);

      res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error: any) {
      this.logger.error('Error in searchCustomers controller', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to search customers',
      });
    }
  };
}
