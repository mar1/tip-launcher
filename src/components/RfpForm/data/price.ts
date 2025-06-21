import { DeepPartialSkipArrayKey } from "react-hook-form";
import { FormSchema, parseNumber } from "../formSchema";
import { createSignal } from "@react-rxjs/utils";
import { state } from "@react-rxjs/core";
import { currencyRate$ } from "@/services/currencyRate";

export const calculatePriceTotals = (formFields: DeepPartialSkipArrayKey<FormSchema>) => {
  const conversionRate = currencyRate$.getValue();

  const prizePool = parseNumber(formFields.prizePool) || 0;
  const findersFeePercent = parseNumber(formFields.findersFeePercent) || 0;

  // Calculate finder's fee amount from percentage
  const findersFeeAmount = (prizePool * findersFeePercent) / 100;

  const totalAmount = prizePool + findersFeeAmount;
  const totalAmountToken = conversionRate ? totalAmount / conversionRate : null;
  const totalAmountWithBuffer = totalAmountToken;

  return { totalAmount, totalAmountToken, totalAmountWithBuffer };
};

export const [setBountyValue$, setBountyValue] = createSignal<number | null>();
export const bountyValue$ = state(setBountyValue$, null);
