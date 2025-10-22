
export function computeOfferPrice(estValue: number, offerBasis: number, repairs: number) {
  const price = Math.round((estValue * offerBasis) - repairs);
  return Math.max(price, 0);
}
