/**
 * Customer Repository Implementation
 * Implements Repository Pattern with MongoDB
 * Following SOLID principles - Single Responsibility and Dependency Inversion
 */

import { ICustomerRepository } from '../../../domain/interfaces/IRepositories';
import { ICustomer } from '../../../domain/entities/Customer';
import { CustomerModel } from '../schemas/CustomerSchema';
import { Logger } from '../../logging/Logger';

export class CustomerRepository implements ICustomerRepository {
  private logger = Logger.getInstance();

  /**
   * Create a new customer
   */
  async create(customer: ICustomer): Promise<ICustomer> {
    try {
      const newCustomer = new CustomerModel(customer);
      const saved = await newCustomer.save();
      this.logger.info('Customer created', { customerId: saved.id });
      return saved.toJSON();
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`Customer with this ${field} already exists`);
      }
      this.logger.error('Error creating customer', { error: error.message });
      throw error;
    }
  }

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<ICustomer | null> {
    try {
      const customer = await CustomerModel.findById(id);
      return customer ? customer.toJSON() : null;
    } catch (error: any) {
      this.logger.error('Error finding customer by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find customer by email
   */
  async findByEmail(email: string): Promise<ICustomer | null> {
    try {
      const customer = await CustomerModel.findOne({ email: email.toLowerCase() });
      return customer ? customer.toJSON() : null;
    } catch (error: any) {
      this.logger.error('Error finding customer by email', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Find customer by document number
   */
  async findByDocument(documentNumber: string): Promise<ICustomer | null> {
    try {
      const customer = await CustomerModel.findOne({ documentNumber });
      return customer ? customer.toJSON() : null;
    } catch (error: any) {
      this.logger.error('Error finding customer by document', { documentNumber, error: error.message });
      throw error;
    }
  }

  /**
   * Update customer information
   */
  async update(id: string, customerData: Partial<ICustomer>): Promise<ICustomer | null> {
    try {
      const customer = await CustomerModel.findByIdAndUpdate(
        id,
        { $set: customerData },
        { new: true, runValidators: true }
      );

      if (customer) {
        this.logger.info('Customer updated', { customerId: id });
        return customer.toJSON();
      }
      return null;
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`Customer with this ${field} already exists`);
      }
      this.logger.error('Error updating customer', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete customer
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await CustomerModel.findByIdAndDelete(id);
      if (result) {
        this.logger.info('Customer deleted', { customerId: id });
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.error('Error deleting customer', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find all customers with pagination
   */
  async findAll(page: number = 1, limit: number = 20): Promise<ICustomer[]> {
    try {
      const skip = (page - 1) * limit;
      const customers = await CustomerModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return customers.map(c => c.toJSON());
    } catch (error: any) {
      this.logger.error('Error finding all customers', { error: error.message });
      throw error;
    }
  }

  /**
   * Count total customers
   */
  async count(): Promise<number> {
    try {
      return await CustomerModel.countDocuments();
    } catch (error: any) {
      this.logger.error('Error counting customers', { error: error.message });
      throw error;
    }
  }

  /**
   * Search customers by name or email
   */
  async search(query: string, page: number = 1, limit: number = 20): Promise<ICustomer[]> {
    try {
      const skip = (page - 1) * limit;
      const searchRegex = new RegExp(query, 'i');
      
      const customers = await CustomerModel.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { documentNumber: searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return customers.map(c => c.toJSON());
    } catch (error: any) {
      this.logger.error('Error searching customers', { query, error: error.message });
      throw error;
    }
  }
}
