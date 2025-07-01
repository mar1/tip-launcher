import { DeepPartialSkipArrayKey } from "react-hook-form";
import { FormSchema, parseNumber } from "../formSchema";
import { createSignal } from "@react-rxjs/utils";
import { state } from "@react-rxjs/core";
import { currencyRate$ } from "@/services/currencyRate";

export const calculatePriceTotals = (formFields: DeepPartialSkipArrayKey<FormSchema>) => {
  const conversionRate = currencyRate$.getValue();

  const tipAmount = parseNumber(formFields.tipAmount) || 0;
  const referralFeePercent = parseNumber(formFields.referralFeePercent) || 0;

  // Calculate referral fee amount from percentage
  const referralFeeAmount = (tipAmount * referralFeePercent) / 100;

  const totalAmount = tipAmount + referralFeeAmount;
  // If DOT, use USD directly (no conversion)
  if (formFields.stablecoin && formFields.stablecoin !== undefined) {
    return { totalAmount, totalAmountToken: totalAmount };
  }
  // For KSM, convert to token value
  const totalAmountToken = conversionRate ? totalAmount / conversionRate : null;

  return { totalAmount, totalAmountToken };
};

export const [setTipValue$, setTipValue] = createSignal<number | null>();
export const tipValue$ = state(setTipValue$, null);
