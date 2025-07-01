import { CHAINS, type ChainType } from "@/constants";
import { state } from "@react-rxjs/core";
import { catchError, map, of, switchMap, timer, combineLatest } from "rxjs";
import { selectedChain$ } from "@/components/ChainSelector/chain.state";

// Create a reactive currency rate that updates based on the selected chain
export const currencyRate$ = state(
  combineLatest([timer(0, 60_000), selectedChain$]).pipe(
    switchMap(([_, selectedChain]) => {
      const chainConfig = CHAINS[selectedChain];
      return fetch(
        `https://api.kraken.com/0/public/Ticker?pair=${chainConfig.krakenPair}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      ).then((r) => r.json())
    }),
    map((v) => {
      if (v.error?.length) {
        throw new Error(v.error[0]);
      }
      // We need to get the current chain from the subject
      const currentChain = selectedChain$.getValue() as ChainType;
      const chainConfig = CHAINS[currentChain];
      return Number(v.result[chainConfig.krakenPair].p[1]);
    }),
    catchError((err) => {
      console.error(err);
      return of(null);
    })
  ),
  null
);

// Legacy export for backward compatibility
export const KRAKEN_SYMBOL_PAIR = CHAINS.KSM.krakenPair;
