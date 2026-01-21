import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ShipmentWizardPage - Page Object para el wizard multi-paso de creación de envío
 * Maneja los 5 pasos del wizard: Direcciones, Cotización, Cliente, Pago, Confirmación
 * 
 * Selectores basados en logistics-front/src/components/ShipmentWizard.tsx
 * 
 * NOTA: El formulario ShipmentDetailsForm usa un sistema de tabs/secciones:
 * - Sección "Remitente" (visible por defecto)
 * - Sección "Destinatario" (visible después de completar remitente y hacer clic en Continuar)
 * - Sección "Paquete" (visible después de completar destinatario)
 * Los campos de cada sección se ocultan al navegar a otra sección.
 */
export class ShipmentWizardPage extends BasePage {
  // Step indicators
  readonly stepIndicator: Locator;
  
  // Section tab buttons (for navigating within ShipmentDetailsForm)
  readonly senderTabButton: Locator;
  readonly receiverTabButton: Locator;
  readonly packageTabButton: Locator;
  
  // Step 3: Customer/Shipment Details - Fields are the same for sender/receiver
  // but only visible one section at a time
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly documentTypeSelect: Locator;
  readonly documentNumberInput: Locator;
  
  readonly packageDescriptionTextarea: Locator;
  
  // Section continue buttons (inside each section)
  readonly sectionContinueButton: Locator;
  readonly sectionBackButton: Locator;
  
  // Main form submit button
  readonly submitFormButton: Locator;
  
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
    
    // Section tabs in ShipmentDetailsForm
    this.senderTabButton = page.locator('button:has-text("Remitente")');
    this.receiverTabButton = page.locator('button:has-text("Destinatario")');
    this.packageTabButton = page.locator('button:has-text("Paquete")');
    
    // Form fields - These are used for the currently visible section
    // Only one section's fields are visible at a time
    this.nameInput = page.locator('input[name="name"]:visible');
    this.emailInput = page.locator('input[name="email"]:visible');
    this.phoneInput = page.locator('input[name="phone"]:visible');
    this.addressInput = page.locator('input[name="address"]:visible');
    this.documentTypeSelect = page.locator('select[name="documentType"]:visible');
    this.documentNumberInput = page.locator('input[name="documentNumber"]:visible');
    
    // Package description (only in package section)
    this.packageDescriptionTextarea = page.locator('textarea[name="packageDescription"]');
    
    // Section navigation buttons
    this.sectionContinueButton = page.locator('button:has-text("Continuar"):visible').first();
    this.sectionBackButton = page.locator('button:has-text("Volver"):visible').first();
    
    // Main submit button at bottom
    this.submitFormButton = page.locator('button:has-text("Continuar al Pago")');
    
    // Step 4: Payment - PaymentForm.tsx uses these exact texts and names
    this.cardPaymentButton = page.locator('button:has-text("💳 Tarjeta")');
    this.cashPaymentButton = page.locator('button:has-text("💵 Efectivo")');
    
    this.cardNumberInput = page.locator('input[name="cardNumber"]');
    this.cardHolderInput = page.locator('input[name="cardHolderName"]');
    this.expiryDateInput = page.locator('input[name="expirationDate"]');
    this.cvvInput = page.locator('input[name="cvv"]');
    
    this.submitPaymentButton = page.locator('button:has-text("Confirmar Pago")');
    
    // Step 5: Confirmation - ShipmentWizard.tsx shows tracking number in a blue text
    // The tracking number is displayed as: <p className="text-4xl font-bold text-blue-600 mb-4">{createdShipment.trackingNumber}</p>
    this.trackingNumber = page.locator('p.text-4xl.font-bold.text-blue-600, p:has-text("LOG-")');
    this.downloadInvoiceButton = page.locator('button:has-text("Imprimir Comprobante")');
    this.goToWarehouseButton = page.locator('button:has-text("Crear Otro Envío")');
  }

  /**
   * Fill customer details (Step 3: Sender information)
   * This fills the sender section which is visible by default
   */
  async fillSenderDetails(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    documentType?: string;
    documentNumber: string;
  }): Promise<void> {
    // Ensure we're on the sender section
    await this.page.waitForTimeout(500);
    
    // Fill visible fields in sender section
    await this.fill(this.nameInput, data.name);
    await this.takeScreenshot('wizard_01_sender_name_filled');
    
    await this.fill(this.emailInput, data.email);
    await this.takeScreenshot('wizard_02_sender_email_filled');
    
    await this.fill(this.phoneInput, data.phone);
    await this.takeScreenshot('wizard_03_sender_phone_filled');
    
    await this.fill(this.addressInput, data.address);
    await this.takeScreenshot('wizard_04_sender_address_filled');
    
    if (data.documentType) {
      await this.documentTypeSelect.selectOption(data.documentType);
    }
    
    await this.fill(this.documentNumberInput, data.documentNumber);
    await this.takeScreenshot('wizard_05_sender_document_filled');
  }

  /**
   * Navigate from sender to receiver section by clicking on Destinatario tab
   */
  async navigateToReceiverSection(): Promise<void> {
    // Click the "Destinatario" tab button to switch to receiver section
    await this.receiverTabButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('wizard_05b_navigated_to_receiver');
  }

  /**
   * Fill receiver details (Step 3: Receiver information)
   * Must be called after navigating to receiver section
   */
  async fillReceiverDetails(data: {
    name: string;
    phone: string;
    address: string;
  }): Promise<void> {
    // Wait for receiver section to be active
    await this.page.waitForTimeout(500);
    
    // Get the receiver section's visible input fields
    const receiverNameInput = this.page.locator('input[name="name"]').last();
    const receiverPhoneInput = this.page.locator('input[name="phone"]').last();
    const receiverAddressInput = this.page.locator('input[name="address"]').last();
    
    await receiverNameInput.fill(data.name);
    await this.takeScreenshot('wizard_06_receiver_name_filled');
    
    await receiverPhoneInput.fill(data.phone);
    await this.takeScreenshot('wizard_07_receiver_phone_filled');
    
    await receiverAddressInput.fill(data.address);
    await this.takeScreenshot('wizard_08_receiver_address_filled');
  }

  /**
   * Navigate from receiver to package section by clicking on Paquete tab
   */
  async navigateToPackageSection(): Promise<void> {
    // Click the "Paquete" tab button to switch to package section
    await this.packageTabButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('wizard_08b_navigated_to_package');
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
   * This navigates through all three sections: Sender → Receiver → Package
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
    // Step 3a: Fill sender details (sender section is visible by default)
    await this.fillSenderDetails(data.sender);
    
    // Navigate to receiver section
    await this.navigateToReceiverSection();
    
    // Step 3b: Fill receiver details
    await this.fillReceiverDetails(data.receiver);
    
    // Navigate to package section
    await this.navigateToPackageSection();
    
    // Step 3c: Fill package description (optional)
    if (data.packageDescription) {
      await this.fillPackageDescription(data.packageDescription);
    }
    
    // Submit the form to continue to payment
    await this.click(this.submitFormButton);
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
    // Wait for payment form to be visible
    await this.page.waitForTimeout(500);
    
    if (method === 'CARD') {
      // Card is selected by default, but click to ensure
      await this.cardPaymentButton.click();
      await this.takeScreenshot('wizard_11_card_payment_selected');
      
      if (cardData) {
        // Fill card details - PaymentForm formats the card number with spaces
        await this.cardNumberInput.fill(cardData.cardNumber);
        await this.cardHolderInput.fill(cardData.cardHolder);
        await this.expiryDateInput.fill(cardData.expiryDate);
        await this.cvvInput.fill(cardData.cvv);
        await this.takeScreenshot('wizard_12_card_details_filled');
      }
    } else {
      // Select cash payment
      await this.cashPaymentButton.click();
      await this.takeScreenshot('wizard_11_cash_payment_selected');
    }
    
    // Wait a bit for validation
    await this.page.waitForTimeout(500);
    
    // Submit payment
    await this.submitPaymentButton.click();
    await this.page.waitForTimeout(5000); // Wait for payment processing animation
    await this.takeScreenshot('wizard_13_payment_submitted');
  }

  /**
   * Get tracking number from confirmation page (Step 5)
   */
  async getTrackingNumber(): Promise<string> {
    // Wait for confirmation page to show the tracking number
    await this.page.waitForTimeout(3000);
    
    // Try to find the tracking number element
    const trackingElement = this.page.locator('p.text-4xl.font-bold.text-blue-600').first();
    await trackingElement.waitFor({ state: 'visible', timeout: 10000 });
    
    const trackingText = await trackingElement.textContent();
    await this.takeScreenshot('wizard_14_confirmation_tracking_number');
    
    return (trackingText || '').trim();
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
