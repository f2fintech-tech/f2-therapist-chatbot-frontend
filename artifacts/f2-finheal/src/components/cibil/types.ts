/** Shared CIBIL-related TypeScript types. */

export interface LenderProduct {
  id: string;
  name: string;
  lenderType: string;
  productType: string;
  category: string;
  minRate: number;
  maxRate: number;
  minTenureYears: number;
  maxTenureYears: number;
  minMonthlyIncome: number;
  minCibil: number;
  maxFoirPct: number;
  minAmount: number;
  maxAmount: number;
  disbursalTime: string;
  pros: string[];
  cons: string[];
  docsRequired: string[];
  processingFee?: string;
  emiPerLakhMin?: string;
  extraParams?: {
    eligibilityCriteria?: string;
    abb_to_emi_factor?: number;
    degreeCaps?: Record<string, number>;
  };
}
