/**
 * MongoDB Schema for Customer
 * Persistence layer following Repository pattern
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ICustomer } from '../../../domain/entities/Customer';

export interface ICustomerDocument extends Omit<ICustomer, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(\+57)?\d{10}$/, 'Please enter a valid Colombian phone number'],
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: {
        values: ['CC', 'CE', 'NIT', 'PASSPORT'],
        message: '{VALUE} is not a valid document type',
      },
    },
    documentNumber: {
      type: String,
      required: [true, 'Document number is required'],
      trim: true,
      minlength: [5, 'Document number must be at least 5 characters'],
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'customers',
  }
);

// Compound index for searching by name and email
CustomerSchema.index({ name: 1, email: 1 });

// Virtual for id (maps _id to id)
CustomerSchema.virtual('id').get(function (this: ICustomerDocument) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
CustomerSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CustomerModel = mongoose.model<ICustomerDocument>(
  'Customer',
  CustomerSchema
);
