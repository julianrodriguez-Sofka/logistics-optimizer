export type DocumentType = 'CC' | 'CE' | 'NIT' | 'PASSPORT';

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  documentType: DocumentType;
  documentNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  documentType: DocumentType;
  documentNumber: string;
}
