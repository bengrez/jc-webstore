export const formatQuoteFolio = (quoteId: number) => {
  return `COT-${String(quoteId).padStart(6, '0')}`
}

