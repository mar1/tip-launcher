import { typedApi } from "@/chain";
import { createReferendaSdk } from "@polkadot-api/sdk-governance";
import { state } from "@react-rxjs/core";
import { TxEvent } from "polkadot-api";
import { combineLatest, map, Observable } from "rxjs";
import {
  decisionDepositProcess$,
  decisionDepositTx$,
  submitdecisionDeposit,
} from "./tx/decisionDeposit";
import {
  referendumCreationProcess$,
  referendumCreationTx$,
  referendumIndex$,
} from "./tx/referendumCreation";
import { TxWithExplanation } from "./tx/types";

const referendaSdk = createReferendaSdk(typedApi);

const txProcessState = (
  tx$: Observable<TxWithExplanation | null>,
  process$: Observable<
    | TxEvent
    | {
      type: "error";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      err: any;
    }
    | null
  >,
  tag: string
) =>
  combineLatest([tx$, process$]).pipe(
    map(([tx, process]) => {
      console.log(`[txProcessState] tag: ${tag}, tx:`, tx, "process:", process);
      if (process) {
        if (process.type === "finalized" && process.ok) {
          const referendum = referendaSdk.getSubmittedReferendum(process);
          return {
            type: "done" as const,
            tag,
            value: {
              txEvent: process,
              referendum,
            },
          };
        }
        if (process.type !== "error" || process.err.message !== "Cancelled") {
          return {
            type: "submitting" as const,
            tag,
            value: {
              txEvent: process,
            },
          };
        }
      }

      return tx
        ? {
          type: "tx" as const,
          tag,
          value: {
            ...tx,
          },
        }
        : null;
    })
  );

export const activeTxStep$ = state(
  combineLatest([
    txProcessState(referendumCreationTx$, referendumCreationProcess$, "ref"),
    txProcessState(decisionDepositTx$, decisionDepositProcess$, "decision"),
  ]).pipe(map((steps) => steps.reverse().reduce((a, b) => a || b, null))),
  null
);

export { referendumIndex$ } from "./tx/referendumCreation";

// Auto-trigger decision deposit ONLY after referendum proposal is finalized and successful
referendumCreationProcess$.subscribe((evt) => {
  if (evt && evt.type === "finalized" && evt.ok) {
    // Only fire once per successful submission
    submitdecisionDeposit();
  }
});
