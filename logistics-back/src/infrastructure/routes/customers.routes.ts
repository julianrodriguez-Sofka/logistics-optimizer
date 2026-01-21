/**
 * Customer Routes
 * RESTful API endpoints for customer management
 */

import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';

const router = Router();
const customerController = new CustomerController();

// Create new customer
router.post('/', customerController.createCustomer);

// Get all customers (with pagination)
router.get('/', customerController.getAllCustomers);

// Search customers
router.get('/search', customerController.searchCustomers);

// Get customer by email
router.get('/email/:email', customerController.getCustomerByEmail);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Delete customer
router.delete('/:id', customerController.deleteCustomer);

export default router;
