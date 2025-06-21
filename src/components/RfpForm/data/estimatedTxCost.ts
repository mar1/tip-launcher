import { typedApi } from "@/chain";
import { TOKEN_DECIMALS } from "@/constants";
import { sum } from "@/lib/math";
import { MultiAddress } from "@polkadot-api/descriptors";
import { state } from "@react-rxjs/core";
import { combineLatest, from, of, switchMap, map } from "rxjs";
import { tipValue$ } from "./price";
import { decisionDeposit, referendaSdk, submissionDeposit } from "./referendaConstants";

const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

const depositCosts$ = combineLatest([
  submissionDeposit,
  tipValue$.pipe(switchMap((v) => decisionDeposit(v ? BigInt(Math.round(v * 10 ** TOKEN_DECIMALS)) : null))),
]).pipe(map((r) => r.reduce(sum, 0n)));

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

  // The native asset is the asset at location {"parents":0,"interior":"Here"}
  const NATIVE_ASSET_V3 = {
    V3: {
      id: { Concrete: { parents: 0, interior: { Here: null } } },
      fun: { Fungible: 0n },
    },
  };

  const tipCall = typedApi.tx.Treasury.spend({
    amount: tipAmountValue,
    beneficiary: MultiAddress.Id(formData.tipBeneficiary),
    asset_kind: NATIVE_ASSET_V3,
  });

  let finalCall = tipCall;
  let totalValue = tipAmountValue;

  if (formData.referralFeePercent && formData.referral) {
    const referralFeeAmount = (tipAmountValue * BigInt(formData.referralFeePercent)) / 100n;
    const referralFeeCall = typedApi.tx.Treasury.spend({
      amount: referralFeeAmount,
      beneficiary: MultiAddress.Id(formData.referral),
      asset_kind: NATIVE_ASSET_V3,
    });
    finalCall = typedApi.tx.Utility.batch_all({
      calls: [tipCall.decodedCall, referralFeeCall.decodedCall],
    });
    totalValue += referralFeeAmount;
  }

  return from(
    finalCall.getEncodedData().then((callData) => referendaSdk.createSpenderReferenda(callData, totalValue))
  ).pipe(
    switchMap((tx) => (tx ? from(tx.getEstimatedFees(ALICE)) : of(0n)))
  );
};
