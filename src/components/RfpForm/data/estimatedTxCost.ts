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
import { createSignal } from "@react-rxjs/utils";

const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

// Create a signal to set the current tipper track
export const [setTipperTrack$, setTipperTrack] = createSignal<"small_tipper" | "big_tipper">();
export const tipperTrack$ = state(setTipperTrack$, "small_tipper" as const);

// Combine tip value with tipper track for accurate deposit calculation
const depositCosts$ = combineLatest([tipValue$, tipperTrack$]).pipe(
  switchMap(([tipValue, tipperTrack]) => {
    const planckValue = tipValue ? BigInt(Math.round(tipValue * 10 ** TOKEN_DECIMALS)) : null;
    return decisionDeposit(planckValue, tipperTrack);
  })
);

// Create estimatedCost$ that only includes deposits for now
export const estimatedCost$ = state(
  combineLatest({
    deposits: depositCosts$,
    fees: of(0n),
  }),
  null,
);
