import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ShipmentWizardPage - Page Object para el wizard multi-paso de creación de envío
 * Maneja los 5 pasos del wizard: Direcciones, Cotización, Cliente, Pago, Confirmación
 * 
 * Selectores basados en logistics-front/src/components/ShipmentWizard.tsx
 */
export class ShipmentWizardPage extends BasePage {
  // Step indicators
  readonly stepIndicator: Locator;
  
  // Step 3: Customer/Shipment Details (sender/receiver)
  readonly senderNameInput: Locator;
  readonly senderEmailInput: Locator;
  readonly senderPhoneInput: Locator;
  readonly senderAddressInput: Locator;
  readonly senderDocumentTypeSelect: Locator;
  readonly senderDocumentNumberInput: Locator;
  
  readonly receiverNameInput: Locator;
  readonly receiverPhoneInput: Locator;
  readonly receiverAddressInput: Locator;
  
  readonly packageDescriptionTextarea: Locator;
  
  readonly continueButton: Locator;
  readonly backButton: Locator;
  
  // Step 4: Payment
  readonly cardPaymentButton: Locator;
  readonly cashPaymentButton: Locator;
  
  readonly cardNumberInput: Locator;
  readonly cardHolderInput: Locator;
  readonly expiryDateInput: Locator;
  readonly cvvInput: Locator;
  
  readonly submitPaymentButton: Locator;
  
  // Step 5: Confirmation
  readonly trackingNumber: Locator;
  readonly downloadInvoiceButton: Locator;
  readonly goToWarehouseButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Step indicator
    this.stepIndicator = page.locator('.step-indicator, [class*="step"]');
    
    // Step 3: Customer Details - Sender fields
    this.senderNameInput = page.locator('input[name="name"], input[placeholder*="Nombre completo"]').first();
    this.senderEmailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.senderPhoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    this.senderAddressInput = page.locator('input[name="address"], textarea[name="address"]').first();
    this.senderDocumentTypeSelect = page.locator('select[name="documentType"]').first();
    this.senderDocumentNumberInput = page.locator('input[name="documentNumber"]').first();
    
    // Receiver fields
    this.receiverNameInput = page.locator('input[name="name"], input[placeholder*="Nombre"]').nth(1);
    this.receiverPhoneInput = page.locator('input[name="phone"], input[type="tel"]').nth(1);
    this.receiverAddressInput = page.locator('input[name="address"], textarea[name="address"]').nth(1);
    
    // Package description
    this.packageDescriptionTextarea = page.locator('textarea[name="packageDescription"], textarea[placeholder*="Descripción"]');
    
    // Navigation buttons
    this.continueButton = page.locator('button:has-text("Continuar"), button:has-text("Continue"), button[type="submit"]');
    this.backButton = page.locator('button:has-text("Atrás"), button:has-text("Back")');
    
    // Step 4: Payment
    this.cardPaymentButton = page.locator('button:has-text("Tarjeta"), label:has-text("Tarjeta")');
    this.cashPaymentButton = page.locator('button:has-text("Efectivo"), label:has-text("Efectivo")');
    
    this.cardNumberInput = page.locator('input[name="cardNumber"], input[placeholder*="número de tarjeta"]');
    this.cardHolderInput = page.locator('input[name="cardHolderName"], input[placeholder*="titular"]');
    this.expiryDateInput = page.locator('input[name="expirationDate"], input[placeholder*="MM/AA"]');
    this.cvvInput = page.locator('input[name="cvv"], input[placeholder*="CVV"]');
    
    this.submitPaymentButton = page.locator('button:has-text("Confirmar"), button:has-text("Pagar"), button[type="submit"]');
    
    // Step 5: Confirmation
    this.trackingNumber = page.locator('p:has-text("#"), .tracking-number, [class*="tracking"]');
    this.downloadInvoiceButton = page.locator('button:has-text("Descargar"), button:has-text("Factura")');
    this.goToWarehouseButton = page.locator('button:has-text("Almacén"), button:has-text("Warehouse")');
  }

  /**
   * Fill customer details (Step 3: Sender information)
   */
  async fillSenderDetails(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    documentType?: string;
    documentNumber: string;
  }): Promise<void> {
    await this.fill(this.senderNameInput, data.name);
    await this.takeScreenshot('wizard_01_sender_name_filled');
    
    await this.fill(this.senderEmailInput, data.email);
    await this.takeScreenshot('wizard_02_sender_email_filled');
    
    await this.fill(this.senderPhoneInput, data.phone);
    await this.takeScreenshot('wizard_03_sender_phone_filled');
    
    await this.fill(this.senderAddressInput, data.address);
    await this.takeScreenshot('wizard_04_sender_address_filled');
    
    if (data.documentType) {
      await this.senderDocumentTypeSelect.selectOption(data.documentType);
    }
    
    await this.fill(this.senderDocumentNumberInput, data.documentNumber);
    await this.takeScreenshot('wizard_05_sender_document_filled');
  }

  /**
   * Fill receiver details (Step 3: Receiver information)
   */
  async fillReceiverDetails(data: {
    name: string;
    phone: string;
    address: string;
  }): Promise<void> {
    await this.fill(this.receiverNameInput, data.name);
    await this.takeScreenshot('wizard_06_receiver_name_filled');
    
    await this.fill(this.receiverPhoneInput, data.phone);
    await this.takeScreenshot('wizard_07_receiver_phone_filled');
    
    await this.fill(this.receiverAddressInput, data.address);
    await this.takeScreenshot('wizard_08_receiver_address_filled');
  }

  /**
   * Fill package description (optional)
   */
  async fillPackageDescription(description: string): Promise<void> {
    await this.fill(this.packageDescriptionTextarea, description);
    await this.takeScreenshot('wizard_09_package_description_filled');
  }

  /**
   * Complete customer details step (Step 3)
   */
  async completeCustomerDetails(data: {
    sender: {
      name: string;
      email: string;
      phone: string;
      address: string;
      documentNumber: string;
    };
    receiver: {
      name: string;
      phone: string;
      address: string;
    };
    packageDescription?: string;
  }): Promise<void> {
    await this.fillSenderDetails(data.sender);
    await this.fillReceiverDetails(data.receiver);
    
    if (data.packageDescription) {
      await this.fillPackageDescription(data.packageDescription);
    }
    
    await this.click(this.continueButton.first());
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('wizard_10_customer_details_submitted');
  }

  /**
   * Select payment method and fill details (Step 4)
   */
  async completePayment(method: 'CARD' | 'CASH', cardData?: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  }): Promise<void> {
    if (method === 'CARD') {
      // Select card payment
      await this.click(this.cardPaymentButton.first());
      await this.takeScreenshot('wizard_11_card_payment_selected');
      
      if (cardData) {
        await this.fill(this.cardNumberInput, cardData.cardNumber);
        await this.fill(this.cardHolderInput, cardData.cardHolder);
        await this.fill(this.expiryDateInput, cardData.expiryDate);
        await this.fill(this.cvvInput, cardData.cvv);
        await this.takeScreenshot('wizard_12_card_details_filled');
      }
    } else {
      // Select cash payment
      await this.click(this.cashPaymentButton.first());
      await this.takeScreenshot('wizard_11_cash_payment_selected');
    }
    
    // Submit payment
    await this.click(this.submitPaymentButton.first());
    await this.page.waitForTimeout(3000); // Wait for payment processing animation
    await this.takeScreenshot('wizard_13_payment_submitted');
  }

  /**
   * Get tracking number from confirmation page (Step 5)
   */
  async getTrackingNumber(): Promise<string> {
    await this.page.waitForTimeout(2000); // Wait for confirmation page
    const trackingText = await this.getText(this.trackingNumber.first());
    await this.takeScreenshot('wizard_14_confirmation_tracking_number');
    return trackingText.replace('#', '').trim();
  }

  /**
   * Complete entire wizard from quote selection to confirmation
   */
  async completeFullWizard(data: {
    sender: {
      name: string;
      email: string;
      phone: string;
      address: string;
      documentNumber: string;
    };
    receiver: {
      name: string;
      phone: string;
      address: string;
    };
    packageDescription?: string;
    paymentMethod: 'CARD' | 'CASH';
    cardData?: {
      cardNumber: string;
      cardHolder: string;
      expiryDate: string;
      cvv: string;
    };
  }): Promise<string> {
    // Step 3: Customer details
    await this.completeCustomerDetails({
      sender: data.sender,
      receiver: data.receiver,
      packageDescription: data.packageDescription,
    });
    
    // Step 4: Payment
    await this.completePayment(data.paymentMethod, data.cardData);
    
    // Step 5: Get tracking number
    const trackingNumber = await this.getTrackingNumber();
    
    return trackingNumber;
  }

  /**
   * Navigate to warehouse from confirmation page
   */
  async goToWarehouse(): Promise<void> {
    await this.click(this.goToWarehouseButton.first());
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('wizard_15_navigated_to_warehouse');
  }
}
