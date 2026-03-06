export interface HistoricalRateResult {
  rate: number;
  quoteDate: string;
}

const FALLBACK_RATES: Record<string, number> = {
  BRL: 1,
  USD: 5.5,
  EUR: 6.3,
  GBP: 7.3,
};

export const getHistoricalRateToBRL = async (
  currencyCode: string,
  paymentDate: string,
): Promise<HistoricalRateResult> => {
  const upperCurrency = currencyCode.toUpperCase();

  if (upperCurrency === "BRL") {
    return { rate: 1, quoteDate: paymentDate };
  }

  try {
    const params = new URLSearchParams({
      currencyCode: upperCurrency,
      paymentDate,
    });
    const response = await fetch(`/api/exchange-rate?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Não foi possível buscar cotação histórica");
    }

    return (await response.json()) as HistoricalRateResult;
  } catch (error) {
    const fallbackRate = FALLBACK_RATES[upperCurrency];

    if (fallbackRate) {
      return { rate: fallbackRate, quoteDate: paymentDate };
    }

    throw error;
  }
};
