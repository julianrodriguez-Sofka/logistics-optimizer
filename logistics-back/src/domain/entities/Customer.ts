/**
 * Customer Entity
 * Represents a customer in the system
 * Following Domain-Driven Design principles
 */

export interface ICustomer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  documentType: 'CC' | 'CE' | 'NIT' | 'PASSPORT';
  documentNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer {
  private _id?: string;
  private _name: string;
  private _email: string;
  private _phone: string;
  private _documentType: 'CC' | 'CE' | 'NIT' | 'PASSPORT';
  private _documentNumber: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(data: ICustomer) {
    this.validateCustomer(data);
    
    this._id = data.id;
    this._name = data.name;
    this._email = data.email;
    this._phone = data.phone;
    this._documentType = data.documentType;
    this._documentNumber = data.documentNumber;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get phone(): string { return this._phone; }
  get documentType(): string { return this._documentType; }
  get documentNumber(): string { return this._documentNumber; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  /**
   * Validate customer data
   * Single Responsibility: Only validates customer business rules
   */
  private validateCustomer(data: ICustomer): void {
    if (!data.name || data.name.trim().length < 3) {
      throw new Error('Customer name must be at least 3 characters long');
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone number format (Colombian format: +57XXXXXXXXXX)');
    }

    if (!data.documentNumber || data.documentNumber.trim().length < 5) {
      throw new Error('Document number must be at least 5 characters long');
    }
  }

  /**
   * Validate email format
   * NOSONAR: ReDoS fixed by using length limits and more specific patterns
   * Security: Regex now uses bounded quantifiers to prevent catastrophic backtracking
   */
  private isValidEmail(email: string): boolean {
    // Length check first (RFC 5321: max 254 characters)
    if (!email || email.length > 254) {
      return false;
    }
    // Safe regex with bounded quantifiers (prevent ReDoS)
    // Format: localpart@domain.tld (simplified but secure)
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Colombian phone format
   * NOSONAR: ReDoS fixed by limiting input length before regex test
   * Security: Pre-validation prevents regex from processing excessively long inputs
   */
  private isValidPhone(phone: string): boolean {
    // Remove spaces first
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Length check prevents ReDoS (Colombian phone is exactly 10 or 13 digits)
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return false;
    }
    
    // Safe regex: Colombian phone +57XXXXXXXXXX or XXXXXXXXXX
    const phoneRegex = /^\+?57[0-9]{10}$|^[0-9]{10}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): ICustomer {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      phone: this._phone,
      documentType: this._documentType,
      documentNumber: this._documentNumber,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Update customer information
   */
  update(data: Partial<Omit<ICustomer, 'id' | 'createdAt'>>): void {
    if (data.name) this._name = data.name;
    if (data.email) this._email = data.email;
    if (data.phone) this._phone = data.phone;
    if (data.documentType) this._documentType = data.documentType;
    if (data.documentNumber) this._documentNumber = data.documentNumber;
    this._updatedAt = new Date();

    // Re-validate after update
    this.validateCustomer(this.toJSON());
  }
}
