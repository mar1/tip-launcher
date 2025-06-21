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
      const tipRecipientAddr = formData.tipBeneficiary;

      const amount$ = combineLatest([
        curatorDeposit$,
        typedApi.query.System.Account.getValue(tipRecipientAddr),
      ]).pipe(map(([deposit, account]) => {
        if (!account) return 0n;
        return (deposit || 0n) - account.data.free;
      }));

      const getReferendumProposal = async (): Promise<TxWithExplanation> => {
        const tipAmountValue = BigInt(Math.round(formData.tipAmount * Math.pow(10, TOKEN_DECIMALS)));

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

        // Use createSpenderReferenda instead of createReferenda
        const spenderReferenda = await referendaSdk.createSpenderReferenda(
          await finalCall.getEncodedData(),
          totalValue
        );

        return {
          tx: spenderReferenda,
          explanation: {
            text: "Tip referendum proposal",
            params: {
              tipRecipient: formData.tipBeneficiary,
              amount: formatToken(tipAmountValue),
              referral: formData.referral || "None",
              referralFee: formData.referralFeePercent ? `${formData.referralFeePercent}%` : "None",
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
        getTrack(BigInt(Math.round(formData.tipAmount * Math.pow(10, TOKEN_DECIMALS)))),
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
                  dest: MultiAddress.Id(tipRecipientAddr),
                  value: amount,
                }),
                explanation: {
                  text: "Transfer balance to tip recipient",
                  params: {
                    destination: tipRecipientAddr,
                    value: formatToken(amount),
                  },
                },
              });
            }

            calls.push({
              tx: referendaSdk.createReferenda(track.origin, proposal),
              explanation: {
                text: "Create tip referendum",
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

export const tipReferendum$ = state(
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
