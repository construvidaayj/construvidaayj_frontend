export type PaymentStatus = "Pagado" | "Pendiente" | "En Proceso";

export type DataClient = {
  clientId: string;
  affiliationId: string;
  fullName: string;
  identification: string;
  companyName: string;
  value: number;
  eps: string;
  arl: string;
  risk: string;
  ccf: string;
  pensionFund: string;
  paid: PaymentStatus;
  observation: string;
  datePaidReceived: string;
  govRegistryCompletedAt: string;
  phones: string[]; 
};

