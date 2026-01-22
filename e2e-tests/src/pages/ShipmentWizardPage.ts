import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ShipmentWizardPage - Page Object para el wizard multi-paso de creación de envío
 * Maneja los 5 pasos del wizard: Direcciones, Cotización, Cliente, Pago, Confirmación
 * 
 * Selectores basados en:
 * - logistics-front/src/components/ShipmentWizard.tsx
 * - logistics-front/src/components/ShipmentDetailsForm.tsx
 * - logistics-front/src/components/PaymentForm.tsx
 */
export class ShipmentWizardPage extends BasePage {
  // Step indicator
  readonly stepIndicator: Locator;
  readonly wizardTitle: Locator;
  
  // Section tabs in ShipmentDetailsForm - used for navigating between sender/receiver/package
  readonly senderTabButton: Locator;
  readonly receiverTabButton: Locator;
  readonly packageTabButton: Locator;
  
  // Sender form fields (ShipmentDetailsForm.tsx - sender section)
  readonly senderNameInput: Locator;
  readonly senderEmailInput: Locator;
  readonly senderPhoneInput: Locator;
  readonly senderAddressInput: Locator;
  readonly senderDocumentTypeSelect: Locator;
  readonly senderDocumentNumberInput: Locator;
  
  // Receiver form fields (ShipmentDetailsForm.tsx - receiver section)
  readonly receiverNameInput: Locator;
  readonly receiverPhoneInput: Locator;
  readonly receiverAddressInput: Locator;
  
  // Package description
  readonly packageDescriptionTextarea: Locator;
  
  // Section continue buttons
  readonly senderContinueButton: Locator;
  readonly receiverContinueButton: Locator;
  readonly receiverBackButton: Locator;
  readonly packageBackButton: Locator;
  
  // Main form submit button - "Continuar al Pago"
  readonly continueToPaymentButton: Locator;
  
  // Step 4: Payment (PaymentForm.tsx)
  readonly cardPaymentButton: Locator;
  readonly cashPaymentButton: Locator;
  
  readonly cardNumberInput: Locator;
  readonly cardHolderInput: Locator;
  readonly expiryDateInput: Locator;
  readonly cvvInput: Locator;
  
  readonly confirmPaymentButton: Locator;
  
  // Payment processing modal
  readonly paymentProcessingModal: Locator;
  readonly paymentSuccessButton: Locator; // "Continuar" button after payment processing
  
  // Step 5: Confirmation (ShipmentWizard.tsx)
  readonly confirmationTitle: Locator;
  readonly trackingNumber: Locator;
  readonly downloadInvoiceButton: Locator;
  readonly createNewShipmentButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Wizard title and step indicator
    this.wizardTitle = page.locator('text=/Crear Nuevo Envío/i');
    this.stepIndicator = page.locator('.step-indicator, [class*="step"]');
    
    // Section tabs in ShipmentDetailsForm - exact button text
    this.senderTabButton = page.locator('button:has-text("Remitente")');
    this.receiverTabButton = page.locator('button:has-text("Destinatario")');
    this.packageTabButton = page.locator('button:has-text("Paquete")');
    
    // Sender form fields - these are in the sender section (visible when sender tab is active)
    // Using the specific section container to avoid confusion with receiver fields
    this.senderNameInput = page.locator('.bg-gradient-to-r.from-indigo-500').locator('..').locator('..').locator('input[name="name"]').first();
    this.senderEmailInput = page.locator('input[name="email"]');
    this.senderPhoneInput = page.locator('.bg-gradient-to-r.from-indigo-500').locator('..').locator('..').locator('input[name="phone"]').first();
    this.senderAddressInput = page.locator('.bg-gradient-to-r.from-indigo-500').locator('..').locator('..').locator('input[name="address"]').first();
    this.senderDocumentTypeSelect = page.locator('select[name="documentType"]');
    this.senderDocumentNumberInput = page.locator('input[name="documentNumber"]');
    
    // Receiver form fields - in the receiver section (pink gradient header)
    this.receiverNameInput = page.locator('.bg-gradient-to-r.from-pink-500').locator('..').locator('..').locator('input[name="name"]');
    this.receiverPhoneInput = page.locator('.bg-gradient-to-r.from-pink-500').locator('..').locator('..').locator('input[name="phone"]');
    this.receiverAddressInput = page.locator('.bg-gradient-to-r.from-pink-500').locator('..').locator('..').locator('input[name="address"]');
    
    // Package description - in the package section (amber gradient header)
    this.packageDescriptionTextarea = page.locator('textarea[name="packageDescription"]');
    
    // Navigation buttons within sections
    this.senderContinueButton = page.locator('button:has-text("Continuar")').first();
    this.receiverContinueButton = page.locator('.bg-pink-600:has-text("Continuar"), button.bg-pink-600');
    this.receiverBackButton = page.locator('.bg-gradient-to-r.from-pink-500').locator('..').locator('..').locator('button:has-text("Volver")');
    this.packageBackButton = page.locator('.bg-gradient-to-r.from-amber-500').locator('..').locator('..').locator('button:has-text("Volver")');
    
    // Main submit button - "Continuar al Pago" at bottom action bar
    this.continueToPaymentButton = page.locator('button:has-text("Continuar al Pago")');
    
    // Payment form elements (PaymentForm.tsx)
    this.cardPaymentButton = page.locator('button:has-text("💳 Tarjeta")');
    this.cashPaymentButton = page.locator('button:has-text("💵 Efectivo")');
    
    this.cardNumberInput = page.locator('input[name="cardNumber"]');
    this.cardHolderInput = page.locator('input[name="cardHolderName"]');
    this.expiryDateInput = page.locator('input[name="expirationDate"]');
    this.cvvInput = page.locator('input[name="cvv"]');
    
    this.confirmPaymentButton = page.locator('button:has-text("Confirmar Pago")');
    
    // Payment processing modal
    this.paymentProcessingModal = page.locator('text=/Procesando/i, .animate-spin').first();
    // Button in the success state of payment modal - has specific green gradient styling
    this.paymentSuccessButton = page.locator('button.bg-gradient-to-r.from-green-500:has-text("Continuar")');
    
    // Confirmation page elements (ShipmentWizard.tsx)
    this.confirmationTitle = page.locator('text=/¡Envío Creado Exitosamente!/i');
    this.trackingNumber = page.locator('p.text-4xl.font-bold.text-blue-600');
    this.downloadInvoiceButton = page.locator('button:has-text("Imprimir Comprobante")');
    this.createNewShipmentButton = page.locator('button:has-text("Crear Otro Envío")');
  }

  /**
   * Verify that we are in the shipment wizard (customer details step)
   */
  async verifyWizardLoaded(): Promise<void> {
    // Wait for either the wizard title or the shipment details form
    await this.page.waitForSelector('text=/Detalles del Envío|Crear Nuevo Envío/i', { timeout: 10000 });
    await this.takeScreenshot('wizard_01_loaded');
  }

  /**
   * Fill sender details (first section of ShipmentDetailsForm)
   */
  async fillSenderDetails(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    documentType?: string;
    documentNumber: string;
  }): Promise<void> {
    // Ensure sender tab is active
    const isSenderActive = await this.senderTabButton.getAttribute('class');
    if (!isSenderActive?.includes('bg-indigo-600')) {
      await this.senderTabButton.click();
      await this.page.waitForTimeout(500);
    }
    
    // Fill sender fields
    const nameInput = this.page.locator('input[name="name"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(data.name);
    await this.takeScreenshot('wizard_02_sender_name');
    
    await this.senderEmailInput.fill(data.email);
    await this.takeScreenshot('wizard_03_sender_email');
    
    const phoneInput = this.page.locator('input[name="phone"]').first();
    await phoneInput.fill(data.phone);
    await this.takeScreenshot('wizard_04_sender_phone');
    
    if (data.documentType) {
      await this.senderDocumentTypeSelect.selectOption(data.documentType);
    }
    
    await this.senderDocumentNumberInput.fill(data.documentNumber);
    await this.takeScreenshot('wizard_05_sender_document');
    
    const addressInput = this.page.locator('input[name="address"]').first();
    await addressInput.fill(data.address);
    await this.takeScreenshot('wizard_06_sender_address');
  }

  /**
   * Navigate from sender to receiver section
   */
  async navigateToReceiverSection(): Promise<void> {
    await this.receiverTabButton.click();
    await this.page.waitForTimeout(800);
    await this.takeScreenshot('wizard_07_receiver_section');
  }

  /**
   * Fill receiver details (second section of ShipmentDetailsForm)
   */
  async fillReceiverDetails(data: {
    name: string;
    phone: string;
    address: string;
  }): Promise<void> {
    // Ensure receiver tab is active
    const isReceiverActive = await this.receiverTabButton.getAttribute('class');
    if (!isReceiverActive?.includes('text-white')) {
      await this.receiverTabButton.click();
      await this.page.waitForTimeout(500);
    }
    
    // Fill receiver fields - use last() to get receiver section fields
    const nameInput = this.page.locator('input[name="name"]').last();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(data.name);
    await this.takeScreenshot('wizard_08_receiver_name');
    
    const phoneInput = this.page.locator('input[name="phone"]').last();
    await phoneInput.fill(data.phone);
    await this.takeScreenshot('wizard_09_receiver_phone');
    
    const addressInput = this.page.locator('input[name="address"]').last();
    await addressInput.fill(data.address);
    await this.takeScreenshot('wizard_10_receiver_address');
  }

  /**
   * Navigate from receiver to package section
   */
  async navigateToPackageSection(): Promise<void> {
    await this.packageTabButton.click();
    await this.page.waitForTimeout(800);
    await this.takeScreenshot('wizard_11_package_section');
  }

  /**
   * Fill package description (optional, third section)
   */
  async fillPackageDescription(description: string): Promise<void> {
    await this.packageDescriptionTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await this.packageDescriptionTextarea.fill(description);
    await this.takeScreenshot('wizard_12_package_description');
  }

  /**
   * Complete customer details step (all three sections)
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
    // Step 1: Fill sender details
    await this.fillSenderDetails(data.sender);
    
    // Step 2: Navigate to receiver and fill
    await this.navigateToReceiverSection();
    await this.fillReceiverDetails(data.receiver);
    
    // Step 3: Navigate to package and fill description
    await this.navigateToPackageSection();
    if (data.packageDescription) {
      await this.fillPackageDescription(data.packageDescription);
    }
    
    // Submit form to continue to payment
    await expect(this.continueToPaymentButton).toBeVisible();
    await expect(this.continueToPaymentButton).toBeEnabled({ timeout: 5000 });
    await this.continueToPaymentButton.click();
    await this.page.waitForTimeout(1500);
    await this.takeScreenshot('wizard_13_customer_details_submitted');
  }

  /**
   * Select card payment and fill card details
   */
  async fillCardPayment(cardData: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  }): Promise<void> {
    // Ensure card payment is selected (should be default)
    await this.cardPaymentButton.click();
    await this.page.waitForTimeout(500);
    await this.takeScreenshot('wizard_14_card_payment_selected');
    
    // Fill card details
    await this.cardNumberInput.fill(cardData.cardNumber);
    await this.cardHolderInput.fill(cardData.cardHolder);
    await this.expiryDateInput.fill(cardData.expiryDate);
    await this.cvvInput.fill(cardData.cvv);
    await this.takeScreenshot('wizard_15_card_details_filled');
  }

  /**
   * Select cash payment
   */
  async selectCashPayment(): Promise<void> {
    await this.cashPaymentButton.click();
    await this.page.waitForTimeout(500);
    await this.takeScreenshot('wizard_14_cash_payment_selected');
  }

  /**
   * Submit payment
   */
  async submitPayment(): Promise<void> {
    await expect(this.confirmPaymentButton).toBeEnabled({ timeout: 5000 });
    await this.confirmPaymentButton.click();
    await this.takeScreenshot('wizard_16_payment_submitted');
  }

  /**
   * Complete payment step with card
   */
  async completeCardPayment(cardData: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  }): Promise<void> {
    await this.fillCardPayment(cardData);
    await this.submitPayment();
    
    // Wait for the "Continuar" button in the payment success modal (max 15s)
    await this.paymentSuccessButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.paymentSuccessButton.click();
    await this.page.waitForTimeout(500); // Brief wait for confirmation to render
    
    await this.takeScreenshot('wizard_17_payment_processing_complete');
  }

  /**
   * Complete payment step with cash
   */
  async completeCashPayment(): Promise<void> {
    await this.selectCashPayment();
    await this.submitPayment();
    
    // Wait for the "Continuar" button in the payment success modal (max 15s)
    await this.paymentSuccessButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.paymentSuccessButton.click();
    await this.page.waitForTimeout(500); // Brief wait for confirmation to render
    
    await this.takeScreenshot('wizard_17_payment_processing_complete');
  }

  /**
   * Get tracking number from confirmation page
   */
  async getTrackingNumber(): Promise<string> {
    await this.trackingNumber.waitFor({ state: 'visible', timeout: 15000 });
    const text = await this.trackingNumber.textContent();
    await this.takeScreenshot('wizard_18_confirmation_page');
    return text?.trim() || '';
  }

  /**
   * Verify confirmation page is displayed
   */
  async verifyConfirmationDisplayed(): Promise<boolean> {
    try {
      await this.confirmationTitle.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Complete the entire wizard flow
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
    // Complete customer details
    await this.completeCustomerDetails({
      sender: data.sender,
      receiver: data.receiver,
      packageDescription: data.packageDescription,
    });
    
    // Complete payment
    if (data.paymentMethod === 'CARD' && data.cardData) {
      await this.completeCardPayment(data.cardData);
    } else {
      await this.completeCashPayment();
    }
    
    // Get tracking number
    return await this.getTrackingNumber();
  }

  /**
   * Click to create a new shipment from confirmation page
   */
  async clickCreateNewShipment(): Promise<void> {
    await expect(this.createNewShipmentButton).toBeVisible();
    await this.createNewShipmentButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('wizard_19_create_new_clicked');
  }

  /**
   * Get common test data for shipment creation
   */
  static getTestData() {
    return {
      sender: {
        name: 'Carlos Rodríguez García',
        email: 'carlos.rodriguez@email.com',
        phone: '3001234567',
        address: 'Calle 72 #10-34, Barrio Chapinero, Bogotá',
        documentNumber: '1234567890'
      },
      receiver: {
        name: 'María González López',
        phone: '3019876543',
        address: 'Carrera 43A #1-50, El Poblado, Medellín'
      },
      packageDescription: 'Documentos empresariales - Material confidencial',
      cardData: {
        cardNumber: '4242424242424242',
        cardHolder: 'CARLOS RODRIGUEZ',
        expiryDate: '12/28',
        cvv: '123'
      }
    };
  }
}
