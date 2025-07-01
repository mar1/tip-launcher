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
import { CHAINS, type ChainType } from "@/constants";
import { selectedChain$ } from "@/components/ChainSelector/chain.state";

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
  combineLatest([tipValue$, selectedChain$]).pipe(
    map(([tipValue, selectedChain]) => {
      const chainConfig = CHAINS[selectedChain as ChainType];
      const planckValue = tipValue ? BigInt(Math.round(tipValue * 10 ** chainConfig.decimals)) : null;

      if (!planckValue) {
        return {
          deposits: 0n,
          fees: 0n,
        };
      }

      // This is a simplified calculation - in a real implementation,
      // you would calculate actual fees based on the transaction size
      const estimatedFee = BigInt(Math.round(0.01 * 10 ** chainConfig.decimals)); // 0.01 token fee
      const submissionDeposit = BigInt(Math.round(1.5 * 10 ** chainConfig.decimals)); // 1.5 token deposit

      return {
        deposits: submissionDeposit,
        fees: estimatedFee,
      };
    })
  ),
  null
);
