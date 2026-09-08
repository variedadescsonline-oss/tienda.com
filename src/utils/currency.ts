import { Currency } from '../types';

export const DEFAULT_EXCHANGE_RATE = 36.8; // 1 USD = 36.8 Córdobas (NIO)

export function usdToNio(usd: number, rate: number = DEFAULT_EXCHANGE_RATE): number {
  return Number((usd * rate).toFixed(2));
}

export function nioToUsd(nio: number, rate: number = DEFAULT_EXCHANGE_RATE): number {
  if (!rate || rate <= 0) return 0;
  return Number((nio / rate).toFixed(2));
}

export function formatUSD(amount: number): string {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNIO(amount: number): string {
  return `C$ ${Number(amount || 0).toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPrice(
  amountUSD: number,
  currency: Currency = 'USD',
  rate: number = DEFAULT_EXCHANGE_RATE,
  showDual = true
): { primary: string; secondary: string; full: string } {
  const nioVal = usdToNio(amountUSD, rate);
  const primary = currency === 'USD' ? formatUSD(amountUSD) : formatNIO(nioVal);
  const secondary = currency === 'USD' ? formatNIO(nioVal) : formatUSD(amountUSD);

  return {
    primary,
    secondary,
    full: showDual ? `${primary} (${secondary})` : primary,
  };
}
