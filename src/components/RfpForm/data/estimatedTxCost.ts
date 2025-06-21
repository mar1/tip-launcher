import { typedApi } from "@/chain";
import { TOKEN_DECIMALS } from "@/constants";
import { sum } from "@/lib/math";
import { MultiAddress } from "@polkadot-api/descriptors";
import { state } from "@react-rxjs/core";
import { combineLatest, from, of, switchMap, map } from "rxjs";
import { bountyValue$ } from "./price";
import { decisionDeposit, referendaSdk, submissionDeposit } from "./referendaConstants";

const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

const depositCosts$ = combineLatest([
  submissionDeposit,
  bountyValue$.pipe(switchMap((v) => decisionDeposit(v ? BigInt(Math.round(v * 10 ** TOKEN_DECIMALS)) : null))),
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
export const calculateFees = (formData: { prizePool: number; findersFeePercent?: number; beneficiary: string; finder?: string }) => {
  if (!formData.prizePool || !formData.beneficiary) return of(0n);

  const prizePoolAmount = BigInt(Math.round(formData.prizePool * 10 ** TOKEN_DECIMALS));

  // The native asset is the asset at location {"parents":0,"interior":"Here"}
  const NATIVE_ASSET_V3 = {
    V3: {
      id: { Concrete: { parents: 0, interior: { Here: null } } },
      fun: { Fungible: 0n },
    },
  };

  const prizePoolCall = typedApi.tx.Treasury.spend({
    amount: prizePoolAmount,
    beneficiary: MultiAddress.Id(formData.beneficiary),
    asset_kind: NATIVE_ASSET_V3,
  });

  let finalCall = prizePoolCall;
  let totalValue = prizePoolAmount;

  if (formData.findersFeePercent && formData.finder) {
    const finderFeeAmount = (prizePoolAmount * BigInt(formData.findersFeePercent)) / 100n;
    const finderFeeCall = typedApi.tx.Treasury.spend({
      amount: finderFeeAmount,
      beneficiary: MultiAddress.Id(formData.finder),
      asset_kind: NATIVE_ASSET_V3,
    });
    finalCall = typedApi.tx.Utility.batch_all({
      calls: [prizePoolCall.decodedCall, finderFeeCall.decodedCall],
    });
    totalValue += finderFeeAmount;
  }

  return from(
    finalCall.getEncodedData().then((callData) => referendaSdk.createSpenderReferenda(callData, totalValue))
  ).pipe(
    switchMap((tx) => (tx ? from(tx.getEstimatedFees(ALICE)) : of(0n)))
  );
};
