/**
 * Shipment Routes
 * RESTful API endpoints for shipment management
 */

import { Router } from 'express';
import { ShipmentController } from '../controllers/ShipmentController';
import { validateShipmentCreation, validateStatusUpdate } from '../middlewares/validateShipment';
import { shipmentCreationLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
const shipmentController = new ShipmentController();

// Create new shipment (with strict rate limiting)
router.post('/', shipmentCreationLimiter, validateShipmentCreation, shipmentController.createShipment);

// Get all shipments (with pagination)
router.get('/', shipmentController.getAllShipments);

// Get statistics
router.get('/statistics', shipmentController.getStatistics);

// Search shipments
router.get('/search', shipmentController.searchShipments);

// Get shipments by status
router.get('/status/:status', shipmentController.getShipmentsByStatus);

// Get shipments by customer
router.get('/customer/:customerId', shipmentController.getShipmentsByCustomer);

// Get shipment by tracking number
router.get('/track/:trackingNumber', shipmentController.getShipmentByTrackingNumber);

// Get shipment by ID
router.get('/:id', shipmentController.getShipmentById);

// Update shipment status
router.put('/:id/status', validateStatusUpdate, shipmentController.updateShipmentStatus);

// Cancel shipment
router.post('/:id/cancel', shipmentController.cancelShipment);

export default router;
