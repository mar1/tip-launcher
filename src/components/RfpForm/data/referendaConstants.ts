import { typedApi } from "@/chain";
import {
  createReferendaSdk,
  kusamaSpenderOrigin,
  PolkadotRuntimeOriginCaller,
  ReferendaTrack,
} from "@polkadot-api/sdk-governance";
import { state } from "@react-rxjs/core";
import { CompatibilityLevel } from "polkadot-api";
import { from } from "rxjs";

export const referendaSdk = createReferendaSdk(typedApi, {
  spenderOrigin: kusamaSpenderOrigin,
});

export const getTrack = async (
  value: bigint | null
): Promise<{
  origin: PolkadotRuntimeOriginCaller;
  track: ReferendaTrack;
}> => {
  const treasurerTrack = await referendaSdk.getTrack("treasurer");
  if (!treasurerTrack) throw new Error("Couldn't find treasurer track");

  const treasurer = {
    origin: {
      type: "Origins",
      value: {
        type: "Treasurer",
        value: undefined,
      },
    } satisfies PolkadotRuntimeOriginCaller,
    track: treasurerTrack,
  };

  // Scheduling needs treasurer track - If we can't approve with curator, then use that track.
  const isCompatible =
    await typedApi.tx.Bounties.approve_bounty_with_curator.isCompatible(
      CompatibilityLevel.Partial
    );
  if (!value || !isCompatible) {
    return treasurer;
  }

  const { track, origin } = referendaSdk.getSpenderTrack(value);
  return { track: await track, origin };
};

export const submissionDeposit =
  typedApi.constants.Referenda.SubmissionDeposit();

export const decisionDeposit = (value: bigint | null) =>
  getTrack(value).then((value) => value.track.decision_deposit);

export const referendaDuration = (value: bigint | null) =>
  getTrack(value).then(
    (value) =>
      value.track.prepare_period +
      value.track.decision_period +
      value.track.confirm_period +
      value.track.min_enactment_period
  );

export const curatorDeposit = typedApi.constants.Bounties.CuratorDepositMax();

export const curatorDeposit$ = state(from(curatorDeposit), null);
