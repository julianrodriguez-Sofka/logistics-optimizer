/**
 * MongoDB Schema for Shipment
 * Persistence layer with embedded documents for complex aggregate
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IShipmentData, IShipmentAddress, IPackageDetails } from '../../../domain/entities/Shipment';
import { IPaymentData, PaymentMethod, PaymentStatus, CardType } from '../../../domain/entities/Payment';
import { IShipmentStatus, ShipmentStatusType } from '../../../domain/entities/ShipmentStatus';
import { Quote } from '../../../domain/entities/Quote';

export interface IShipmentDocument extends Omit<IShipmentData, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Sub-schemas
const AddressSchema = new Schema<IShipmentAddress>(
  {
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    originCoordinates: {
      lat: Number,
      lng: Number,
    },
    destinationCoordinates: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: false }
);

const PackageSchema = new Schema<IPackageDetails>(
  {
    weight: {
      type: Number,
      required: true,
      min: [0.1, 'Weight must be at least 0.1 kg'],
      max: [1000, 'Weight cannot exceed 1000 kg'],
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: [1, 'Length must be at least 1 cm'],
      },
      width: {
        type: Number,
        required: true,
        min: [1, 'Width must be at least 1 cm'],
      },
      height: {
        type: Number,
        required: true,
        min: [1, 'Height must be at least 1 cm'],
      },
    },
    fragile: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const CardInfoSchema = new Schema(
  {
    cardNumber: { type: String, required: true }, // Last 4 digits
    cardHolderName: { type: String, required: true, trim: true },
    cardType: {
      type: String,
      enum: ['CREDIT', 'DEBIT'] as CardType[],
      required: true,
    },
    expirationDate: { type: String, required: true }, // MM/YY
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPaymentData>(
  {
    method: {
      type: String,
      enum: ['CARD', 'CASH'] as PaymentMethod[],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    currency: {
      type: String,
      required: true,
      length: 3,
      default: 'COP',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'] as PaymentStatus[],
      default: 'PENDING',
    },
    cardInfo: CardInfoSchema,
    transactionId: { type: String, trim: true },
    processedAt: Date,
    errorMessage: { type: String, trim: true },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IShipmentStatus>(
  {
    status: {
      type: String,
      enum: [
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
      ] as ShipmentStatusType[],
      required: true,
    },
    timestamp: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    location: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { _id: false }
);

// Main Shipment Schema
const ShipmentSchema = new Schema<IShipmentDocument>(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Note: Index defined via ShipmentSchema.index() below
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    package: {
      type: PackageSchema,
      required: true,
    },
    pickupDate: {
      type: Date,
      required: true,
      // Note: Index defined via ShipmentSchema.index() below
    },
    selectedQuote: {
      type: Schema.Types.Mixed, // Store Quote as plain object
      required: true,
    },
    payment: {
      type: PaymentSchema,
      required: true,
    },
    currentStatus: {
      type: String,
      enum: [
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
      ] as ShipmentStatusType[],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    estimatedDeliveryDate: {
      type: Date,
      // Note: Index defined via ShipmentSchema.index() below
    },
    actualDeliveryDate: Date,
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    collection: 'shipments',
  }
);

// Indexes for efficient querying
// Note: trackingNumber index is created automatically by `unique: true`
ShipmentSchema.index({ customer: 1, createdAt: -1 });
ShipmentSchema.index({ currentStatus: 1, createdAt: -1 });
ShipmentSchema.index({ 'payment.status': 1 });
ShipmentSchema.index({ pickupDate: 1 });
ShipmentSchema.index({ estimatedDeliveryDate: 1 });

// Compound index for warehouse queries
ShipmentSchema.index({ currentStatus: 1, pickupDate: -1 });

// Text index for search functionality
ShipmentSchema.index({
  trackingNumber: 'text',
  'address.origin': 'text',
  'address.destination': 'text',
});

// Virtual for id
ShipmentSchema.virtual('id').get(function (this: IShipmentDocument) {
  return this._id.toHexString();
});

// Ensure virtuals and populate customer in JSON
ShipmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Pre-save middleware to initialize status history
ShipmentSchema.pre('save', function (next) {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.currentStatus,
      timestamp: new Date(),
      notes: 'Shipment created',
    });
  }
  next();
});

export const ShipmentModel = mongoose.model<IShipmentDocument>(
  'Shipment',
  ShipmentSchema
);
