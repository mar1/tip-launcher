import { typedApi } from "@/chain";
import { formatToken } from "@/lib/formatToken";
import { MultiAddress } from "@polkadot-api/descriptors";
import { createReferendaSdk } from "@polkadot-api/sdk-governance";
import { state } from "@react-rxjs/core";
import { TOKEN_DECIMALS } from "@/constants";
import {
  combineLatest,
  filter,
  map,
  merge,
  switchMap,
} from "rxjs";
import {
  curatorDeposit$,
} from "../../RfpForm/data";
import { dismissable, submittedFormData$ } from "../modalActions";
import { createTxProcess } from "./txProcess";
import { TxWithExplanation } from "./types";
import { getTrack } from "@/components/RfpForm/data/referendaConstants";

const referendaSdk = createReferendaSdk(typedApi);

export const referendumCreationTx$ = state(
  submittedFormData$.pipe(
    filter((v) => !!v),
    switchMap((formData) => {
      const curatorAddr = formData.beneficiary;

      const amount$ = combineLatest([
        curatorDeposit$,
        typedApi.query.System.Account.getValue(curatorAddr),
      ]).pipe(map(([deposit, account]) => {
        if (!account) return 0n;
        return (deposit || 0n) - account.data.free;
      }));

      const getReferendumProposal = async (): Promise<TxWithExplanation> => {
        const prizePoolAmount = BigInt(Math.round(formData.prizePool * Math.pow(10, TOKEN_DECIMALS)));

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

        // Use createSpenderReferenda instead of createReferenda
        const spenderReferenda = await referendaSdk.createSpenderReferenda(
          await finalCall.getEncodedData(),
          totalValue
        );

        return {
          tx: spenderReferenda,
          explanation: {
            text: "Treasury spend referendum",
            params: {
              beneficiary: formData.beneficiary,
              amount: formatToken(prizePoolAmount),
              finder: formData.finder || "None",
              finderFee: formData.findersFeePercent ? `${formData.findersFeePercent}%` : "None",
            },
          },
        };
      };

      const proposal = getReferendumProposal();
      const proposalCallData = proposal.then((r) => r.tx.getEncodedData());
      const proposalTxExplanation = proposal.then((r) => r.explanation);

      return combineLatest([
        proposalCallData,
        proposalTxExplanation,
        amount$,
        getTrack(BigInt(Math.round(formData.prizePool * Math.pow(10, TOKEN_DECIMALS)))),
      ]).pipe(
        map(
          ([
            proposal,
            proposalExplanation,
            amount,
            track,
          ]) => {
            const calls: TxWithExplanation[] = [];

            if (amount > 0) {
              calls.push({
                tx: typedApi.tx.Balances.transfer_keep_alive({
                  dest: MultiAddress.Id(curatorAddr),
                  value: amount,
                }),
                explanation: {
                  text: "Transfer balance to curator",
                  params: {
                    destination: curatorAddr,
                    value: formatToken(amount),
                  },
                },
              });
            }

            calls.push({
              tx: referendaSdk.createReferenda(track.origin, proposal),
              explanation: {
                text: "Create referendum",
                params: {
                  track: formatTrackName(track.track.name),
                  call: proposalExplanation,
                },
              },
            });

            if (calls.length > 1) {
              return {
                tx: typedApi.tx.Utility.batch_all({
                  calls: calls.map((c) => c.tx.decodedCall),
                }),
                explanation: {
                  text: "batch",
                  params: Object.fromEntries(
                    calls.map((v, i) => [i, v.explanation])
                  ),
                },
              };
            }
            return calls[0];
          }
        ),
        dismissable()
      );
    })
  ),
  null
);

const formatTrackName = (track: string) => track.replace(/_/g, " ");

export const [referendumCreationProcess$, submitReferendumCreation] =
  createTxProcess(referendumCreationTx$.pipe(map((v) => v?.tx ?? null)));

export const rfpReferendum$ = state(
  referendumCreationProcess$.pipe(
    filter((v) => v?.type === "finalized" && v.ok),
    switchMap(async (v) => {
      const referendum = referendaSdk.getSubmittedReferendum(v);
      if (!referendum) {
        throw new Error("Submitted referendum could not be found");
      }
      return referendum;
    })
  )
);
