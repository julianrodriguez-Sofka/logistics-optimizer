/**
 * Shipment Validation Middleware
 * Validates shipment requests before processing
 */

import { Request, Response, NextFunction } from 'express';
import { ShipmentStatusType } from '../../domain/entities/ShipmentStatus';

/**
 * Validate shipment creation request
 */
export const validateShipmentCreation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { customer, address, package: pkg, pickupDate, selectedQuote, paymentRequest } = req.body;

  // Validate customer
  if (!customer) {
    res.status(400).json({
      success: false,
      error: 'Customer information is required',
      field: 'customer',
    });
    return;
  }

  if (!customer.name || customer.name.trim().length < 3) {
    res.status(400).json({
      success: false,
      error: 'Customer name must be at least 3 characters',
      field: 'customer.name',
    });
    return;
  }

  if (!customer.email || !/^\S+@\S+\.\S+$/.test(customer.email)) {
    res.status(400).json({
      success: false,
      error: 'Valid email is required',
      field: 'customer.email',
    });
    return;
  }

  if (!customer.phone || !/^(\+57)?[0-9]{10}$/.test(customer.phone.replace(/\s/g, ''))) {
    res.status(400).json({
      success: false,
      error: 'Valid Colombian phone number is required',
      field: 'customer.phone',
    });
    return;
  }

  if (!customer.documentType || !['CC', 'CE', 'NIT', 'PASSPORT'].includes(customer.documentType)) {
    res.status(400).json({
      success: false,
      error: 'Valid document type is required (CC, CE, NIT, PASSPORT)',
      field: 'customer.documentType',
    });
    return;
  }

  if (!customer.documentNumber || customer.documentNumber.trim().length < 5) {
    res.status(400).json({
      success: false,
      error: 'Document number must be at least 5 characters',
      field: 'customer.documentNumber',
    });
    return;
  }

  // Validate address
  if (!address || !address.origin || !address.destination) {
    res.status(400).json({
      success: false,
      error: 'Origin and destination addresses are required',
      field: 'address',
    });
    return;
  }

  // Validate package
  if (!pkg) {
    res.status(400).json({
      success: false,
      error: 'Package information is required',
      field: 'package',
    });
    return;
  }

  if (!pkg.weight || pkg.weight <= 0) {
    res.status(400).json({
      success: false,
      error: 'Package weight must be greater than 0',
      field: 'package.weight',
    });
    return;
  }

  if (!pkg.dimensions || !pkg.dimensions.length || !pkg.dimensions.width || !pkg.dimensions.height) {
    res.status(400).json({
      success: false,
      error: 'Package dimensions (length, width, height) are required',
      field: 'package.dimensions',
    });
    return;
  }

  // Validate pickup date
  if (!pickupDate) {
    res.status(400).json({
      success: false,
      error: 'Pickup date is required',
      field: 'pickupDate',
    });
    return;
  }

  const pickupDateObj = new Date(pickupDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (pickupDateObj < today) {
    res.status(400).json({
      success: false,
      error: 'Pickup date cannot be in the past',
      field: 'pickupDate',
    });
    return;
  }

  // Validate selected quote
  if (!selectedQuote) {
    res.status(400).json({
      success: false,
      error: 'Selected quote is required',
      field: 'selectedQuote',
    });
    return;
  }

  // Validate payment request
  if (!paymentRequest) {
    res.status(400).json({
      success: false,
      error: 'Payment information is required',
      field: 'paymentRequest',
    });
    return;
  }

  if (!paymentRequest.method || !['CARD', 'CASH'].includes(paymentRequest.method)) {
    res.status(400).json({
      success: false,
      error: 'Valid payment method is required (CARD or CASH)',
      field: 'paymentRequest.method',
    });
    return;
  }

  if (!paymentRequest.amount || paymentRequest.amount <= 0) {
    res.status(400).json({
      success: false,
      error: 'Payment amount must be greater than 0',
      field: 'paymentRequest.amount',
    });
    return;
  }

  // Validate card payment details
  if (paymentRequest.method === 'CARD') {
    if (!paymentRequest.cardNumber || paymentRequest.cardNumber.trim().length < 13) {
      res.status(400).json({
        success: false,
        error: 'Valid card number is required',
        field: 'paymentRequest.cardNumber',
      });
      return;
    }

    if (!paymentRequest.cardHolderName || paymentRequest.cardHolderName.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: 'Card holder name is required',
        field: 'paymentRequest.cardHolderName',
      });
      return;
    }

    if (!paymentRequest.expirationDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentRequest.expirationDate)) {
      res.status(400).json({
        success: false,
        error: 'Valid expiration date is required (MM/YY)',
        field: 'paymentRequest.expirationDate',
      });
      return;
    }

    if (!paymentRequest.cvv || !/^\d{3,4}$/.test(paymentRequest.cvv)) {
      res.status(400).json({
        success: false,
        error: 'Valid CVV is required (3 or 4 digits)',
        field: 'paymentRequest.cvv',
      });
      return;
    }
  }

  next();
};

/**
 * Validate status update request
 */
export const validateStatusUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { status } = req.body;

  if (!status) {
    res.status(400).json({
      success: false,
      error: 'Status is required',
      field: 'status',
    });
    return;
  }

  const validStatuses: ShipmentStatusType[] = [
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

  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      field: 'status',
    });
    return;
  }

  next();
};
