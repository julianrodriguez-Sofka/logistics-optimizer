/**
 * Shipment Validation Middleware
 * Validates shipment requests before processing
 */

import { Request, Response, NextFunction } from 'express';
import { ShipmentStatusType } from '../../domain/entities/ShipmentStatus';

// ============================================================================
// TYPE DEFINITIONS - Replace 'any' with specific types
// ============================================================================

interface AddressValidation {
  origin?: string;
  destination?: string;
}

interface PackageDimensionsValidation {
  length?: number;
  width?: number;
  height?: number;
}

interface CardDetailsValidation {
  cardNumber?: string;
  cardHolderName?: string;
  expirationDate?: string;
  cvv?: string;
}

interface CustomerValidation {
  name?: string;
  email?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
}

interface PackageValidation {
  weight?: number;
  dimensions?: PackageDimensionsValidation;
}

interface PaymentRequestValidation {
  method?: string;
  amount?: number;
  cardNumber?: string;
  cardHolderName?: string;
  expirationDate?: string;
  cvv?: string;
}

// ============================================================================
// VALIDATION HELPERS - Extract logic to reduce complexity
// ============================================================================

const sendValidationError = (res: Response, error: string, field: string): void => {
  res.status(400).json({ success: false, error, field });
};

const validateCustomerName = (name: string): string | null => {
  if (!name || name.trim().length < 3) {
    return 'Customer name must be at least 3 characters';
  }
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Valid email is required';
  }
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone || !/^(\+57)?\d{10}$/.test(phone.replaceAll(/\s/g, ''))) {
    return 'Valid Colombian phone number is required';
  }
  return null;
};

const validateDocumentType = (documentType: string): string | null => {
  const validTypes = ['CC', 'CE', 'NIT', 'PASSPORT'];
  if (!documentType || !validTypes.includes(documentType)) {
    return 'Valid document type is required (CC, CE, NIT, PASSPORT)';
  }
  return null;
};

const validateDocumentNumber = (documentNumber: string): string | null => {
  if (!documentNumber || documentNumber.trim().length < 5) {
    return 'Document number must be at least 5 characters';
  }
  return null;
};

const validateAddress = (address: AddressValidation): string | null => {
  if (!address || !address.origin || !address.destination) {
    return 'Origin and destination addresses are required';
  }
  return null;
};

const validatePackageWeight = (weight: number): string | null => {
  if (!weight || weight <= 0) {
    return 'Package weight must be greater than 0';
  }
  return null;
};

const validatePackageDimensions = (dimensions: PackageDimensionsValidation): string | null => {
  if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) {
    return 'Package dimensions (length, width, height) are required';
  }
  return null;
};

const validatePickupDate = (pickupDate: string): string | null => {
  if (!pickupDate) {
    return 'Pickup date is required';
  }

  const pickupDateObj = new Date(pickupDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (pickupDateObj < today) {
    return 'Pickup date cannot be in the past';
  }

  return null;
};

const validatePaymentMethod = (method: string): string | null => {
  if (!method || !['CARD', 'CASH'].includes(method)) {
    return 'Valid payment method is required (CARD or CASH)';
  }
  return null;
};

const validatePaymentAmount = (amount: number): string | null => {
  if (!amount || amount <= 0) {
    return 'Payment amount must be greater than 0';
  }
  return null;
};

const validateCardDetails = (paymentRequest: CardDetailsValidation): { error: string | null; field: string } => {
  if (!paymentRequest.cardNumber || paymentRequest.cardNumber.trim().length < 13) {
    return { error: 'Valid card number is required', field: 'paymentRequest.cardNumber' };
  }

  if (!paymentRequest.cardHolderName || paymentRequest.cardHolderName.trim().length < 3) {
    return { error: 'Card holder name is required', field: 'paymentRequest.cardHolderName' };
  }

  if (!paymentRequest.expirationDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentRequest.expirationDate)) {
    return { error: 'Valid expiration date is required (MM/YY)', field: 'paymentRequest.expirationDate' };
  }

  if (!paymentRequest.cvv || !/^\d{3,4}$/.test(paymentRequest.cvv)) {
    return { error: 'Valid CVV is required (3 or 4 digits)', field: 'paymentRequest.cvv' };
  }

  return { error: null, field: '' };
};

const validateCustomer = (customer: CustomerValidation, res: Response): boolean => {
  if (!customer) {
    sendValidationError(res, 'Customer information is required', 'customer');
    return false;
  }

  const validations = [
    { fn: () => validateCustomerName(customer.name!), field: 'customer.name' },
    { fn: () => validateEmail(customer.email!), field: 'customer.email' },
    { fn: () => validatePhone(customer.phone!), field: 'customer.phone' },
    { fn: () => validateDocumentType(customer.documentType!), field: 'customer.documentType' },
    { fn: () => validateDocumentNumber(customer.documentNumber!), field: 'customer.documentNumber' },
  ];

  for (const validation of validations) {
    const error = validation.fn();
    if (error) {
      sendValidationError(res, error, validation.field);
      return false;
    }
  }

  return true;
};

const validatePackageInfo = (pkg: PackageValidation, res: Response): boolean => {
  if (!pkg) {
    sendValidationError(res, 'Package information is required', 'package');
    return false;
  }

  let error = validatePackageWeight(pkg.weight!);
  if (error) {
    sendValidationError(res, error, 'package.weight');
    return false;
  }

  error = validatePackageDimensions(pkg.dimensions!);
  if (error) {
    sendValidationError(res, error, 'package.dimensions');
    return false;
  }

  return true;
};

const validatePaymentInfo = (paymentRequest: PaymentRequestValidation, res: Response): boolean => {
  if (!paymentRequest) {
    sendValidationError(res, 'Payment information is required', 'paymentRequest');
    return false;
  }

  let error = validatePaymentMethod(paymentRequest.method!);
  if (error) {
    sendValidationError(res, error, 'paymentRequest.method');
    return false;
  }

  error = validatePaymentAmount(paymentRequest.amount!);
  if (error) {
    sendValidationError(res, error, 'paymentRequest.amount');
    return false;
  }

  if (paymentRequest.method === 'CARD') {
    const cardValidation = validateCardDetails(paymentRequest);
    if (cardValidation.error) {
      sendValidationError(res, cardValidation.error, cardValidation.field);
      return false;
    }
  }

  return true;
};

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
  if (!validateCustomer(customer, res)) return;

  // Validate address
  const addressError = validateAddress(address);
  if (addressError) {
    sendValidationError(res, addressError, 'address');
    return;
  }

  // Validate package
  if (!validatePackageInfo(pkg, res)) return;

  // Validate pickup date
  const dateError = validatePickupDate(pickupDate);
  if (dateError) {
    sendValidationError(res, dateError, 'pickupDate');
    return;
  }

  // Validate selected quote
  if (!selectedQuote) {
    sendValidationError(res, 'Selected quote is required', 'selectedQuote');
    return;
  }

  // Validate payment
  if (!validatePaymentInfo(paymentRequest, res)) return;

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
    sendValidationError(res, 'Status is required', 'status');
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
    sendValidationError(
      res,
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      'status'
    );
    return;
  }

  next();
};
