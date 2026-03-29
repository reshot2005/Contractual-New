/** Indian Rupee display helpers - app default currency is INR. */

export const CURRENCY_SYMBOL = "\u20B9" as const
export const CURRENCY_CODE = "INR" as const

export function formatCurrency(
  amount: number,
  options?: { maximumFractionDigits?: number }
): string {
  const n = Number.isFinite(amount) ? amount : 0
  return `${CURRENCY_SYMBOL}${n.toLocaleString("en-IN", {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: 0,
  })}`
}

/** Example: "₹800 - ₹13,800" */
export function formatCurrencyRange(min: number, max: number): string {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

/** Example: "₹800/hr - ₹13,800/hr" */
export function formatHourlyRange(min: number, max: number): string {
  return `${formatCurrency(min)}/hr - ${formatCurrency(max)}/hr`
}

export function formatGigBudgetRange(opts: {
  budgetAmount?: number | null
  minBudget?: number | null
  maxBudget?: number | null
  budgetType?: string | null
}): string {
  const base = Number(opts.budgetAmount ?? 0)
  const min = Number(opts.minBudget ?? base)
  const max = Number(opts.maxBudget ?? base)
  const suffix = opts.budgetType === "HOURLY" ? "/hr" : ""
  return `${formatCurrency(min)} - ${formatCurrency(max)}${suffix}`
}
