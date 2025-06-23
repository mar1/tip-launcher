import { typedApi } from "@/chain";
import { TOKEN_DECIMALS } from "@/constants";
import { sum } from "@/lib/math";
import { MultiAddress } from "@polkadot-api/descriptors";
import { state } from "@react-rxjs/core";
import { combineLatest, from, of, switchMap, map } from "rxjs";
import { tipValue$ } from "./price";
import {
  decisionDeposit,
  referendaSdk,
} from "./referendaConstants";
import { Binary } from "@polkadot-api/substrate-bindings";

const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

const depositCosts$ = tipValue$.pipe(
  switchMap((v) =>
    decisionDeposit(v ? BigInt(Math.round(v * 10 ** TOKEN_DECIMALS)) : null)
  )
);

// Create estimatedCost$ that only includes deposits for now
// Fees will be calculated separately when we have form data
export const estimatedCost$ = state(
  combineLatest({
    deposits: depositCosts$,
    fees: of(0n),
  }),
  null,
);

// Function to calculate fees for a specific form data
export const calculateFees = (formData: { tipAmount: number; referralFeePercent?: number; tipBeneficiary: string; referral?: string }) => {
  if (!formData.tipAmount || !formData.tipBeneficiary) return of(0n);

  const tipAmountValue = BigInt(Math.round(formData.tipAmount * 10 ** TOKEN_DECIMALS));

  const tipCall = typedApi.tx.Treasury.spend_local({
    amount: tipAmountValue,
    beneficiary: MultiAddress.Id(formData.tipBeneficiary),
  });

  let finalCall: any = tipCall;
  let totalValue = tipAmountValue;

  if (formData.referralFeePercent && formData.referral) {
    const referralFeeAmount = (tipAmountValue * BigInt(formData.referralFeePercent)) / 100n;
    const referralFeeCall = typedApi.tx.Treasury.spend_local({
      amount: referralFeeAmount,
      beneficiary: MultiAddress.Id(formData.referral),
    });
    finalCall = typedApi.tx.Utility.batch_all({
      calls: [tipCall.decodedCall, referralFeeCall.decodedCall],
    });
    totalValue += referralFeeAmount;
  }

  return from(
    finalCall
      .getEncodedData()
      .then((callData: Uint8Array) =>
        referendaSdk.createSpenderReferenda(new Binary(callData), totalValue)
      )
  ).pipe(
    switchMap((tx: any) => (tx ? from(tx.getEstimatedFees(ALICE)) : of(0n)))
  );
};
