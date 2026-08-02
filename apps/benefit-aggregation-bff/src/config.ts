export const upstreams = {
  jobBankBffUrl: process.env['JOB_BANK_BFF_URL'] ?? 'http://localhost:3001',
  employmentInsuranceBffUrl: process.env['EMPLOYMENT_INSURANCE_BFF_URL'] ?? 'http://localhost:3002',
  clientProfileServiceUrl: process.env['CLIENT_PROFILE_SERVICE_URL'] ?? 'http://localhost:3003',
};
