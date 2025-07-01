"use client"

import { formatToken, formatUsd } from "@/lib/formatToken"
import { useStateObservable } from "@react-rxjs/core"
import { TriangleAlert, CheckCircle2, Info } from "lucide-react"
import { type FC, useEffect, useMemo, useState } from "react"
import { useWatch, type DeepPartialSkipArrayKey } from "react-hook-form"
import { openSelectAccount, selectedAccount$ } from "../SelectAccount"
import { estimatedCost$, signerBalance$, setTipperTrack } from "./data"
import { calculatePriceTotals, setTipValue } from "./data/price"
import { currencyRate$ } from "@/services/currencyRate"
import { FormInputField } from "./FormInputField"
import { type TipControlType, type FormSchema, parseNumber } from "./formSchema"
import { useFormContext } from "react-hook-form"
import { submissionDeposit, getTrack } from "./data/referendaConstants"
import { CHAINS } from "@/constants"
import { selectedChain$ } from "../ChainSelector/chain.state"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select"
import { STABLECOINS } from "@/constants"

const ALICE_DUMMY = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

export const FundingSection: FC<{ control: TipControlType; onTooBigChange?: (isTooBig: boolean) => void }> = ({ control, onTooBigChange }) => {
  const tipAmount = useWatch({ control, name: "tipAmount" })
  const referralFeePercent = useWatch({ control, name: "referralFeePercent" })
  const tipperTrack = useWatch({ control, name: "tipperTrack" })
  const tipBeneficiary = useWatch({ control, name: "tipBeneficiary" })
  const referral = useWatch({ control, name: "referral" })
  const currencyRate = useStateObservable(currencyRate$)
  const selectedChain = useStateObservable(selectedChain$)
  const { setValue, getValues } = useFormContext<FormSchema>()
  const [submissionDepositKSM, setSubmissionDepositKSM] = useState<string | null>(null)
  const [trackDepositKSM, setTrackDepositKSM] = useState<string | null>(null)
  const stablecoin = useWatch({ control, name: "stablecoin" })

  const chainConfig = CHAINS[selectedChain]

  // Calculate referral fee amount from percentage
  const referralFeeAmount = useMemo(() => {
    const tipAmountValue = parseNumber(tipAmount) || 0
    const feePercent = parseNumber(referralFeePercent) || 0
    return (tipAmountValue * feePercent) / 100
  }, [tipAmount, referralFeePercent])

  // Track selection logic (automated) - now chain-specific
  let tipAmountValue = parseNumber(tipAmount) || 0
  let tipAmountToken = 0
  let autoTrack: "small_tipper" | "big_tipper" = "small_tipper"
  let isTooBig = false
  if (selectedChain === "DOT") {
    // Use USD directly, no conversion
    if (tipAmountValue > 2500) autoTrack = "big_tipper"
    isTooBig = tipAmountValue > 10000
  } else {
    // Existing logic for KSM
    tipAmountToken = currencyRate ? tipAmountValue / currencyRate : 0
    if (tipAmountToken > chainConfig.smallTipperLimit) autoTrack = "big_tipper"
    isTooBig = tipAmountToken > chainConfig.bigTipperLimit
  }

  // Set tipperTrack automatically whenever tipAmountToken changes
  useEffect(() => {
    setValue("tipperTrack", autoTrack)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrack])

  // Update the deposit calculation when tipper track changes
  useEffect(() => {
    if (tipperTrack) {
      setTipperTrack(tipperTrack)
    }
  }, [tipperTrack])

  useEffect(() => {
    // submissionDeposit is a promise-like (from polkadot-api)
    Promise.resolve(submissionDeposit).then((val) => {
      setSubmissionDepositKSM(formatToken(val))
    })
  }, [])

  useEffect(() => {
    if (tipperTrack) {
      getTrack(null, tipperTrack).then((trackInfo) => {
        setTrackDepositKSM(formatToken(trackInfo.track.decision_deposit))
      })
    }
  }, [tipperTrack])

  useEffect(() => {
    if (onTooBigChange) onTooBigChange(isTooBig)
  }, [isTooBig, onTooBigChange])

  // Preselect USDC for Polkadot if not set
  useEffect(() => {
    if (selectedChain === "DOT" && !stablecoin) {
      setValue("stablecoin", "USDC")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChain, stablecoin])

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Tip Amount</h3>
      {selectedChain === "DOT" && (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Stablecoin</label>
          <Select
            value={stablecoin as 'USDC' | 'USDT' | undefined}
            onValueChange={v => setValue("stablecoin", v as 'USDC' | 'USDT')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select stablecoin (USDC or USDT)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">
                <img src={import.meta.env.BASE_URL + "usdc.svg"} alt="USDC" className="inline-block w-5 h-5 mr-2 align-middle" />
                USDC
              </SelectItem>
              <SelectItem value="USDT">
                <img src={import.meta.env.BASE_URL + "usdt.svg"} alt="USDT" className="inline-block w-5 h-5 mr-2 align-middle" />
                USDT
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <FormInputField
          control={control}
          name="tipAmount"
          label="Tip Amount (USD)"
          description="amount to be awarded to the tip recipient"
          type="number"
        />
        <FormInputField
          control={control}
          name="referralFeePercent"
          label="Referral Fee (%)"
          description="percentage of tip amount awarded to the referral"
          type="number"
          min={0}
          max={100}
          step={0.1}
        />
      </div>

      {/* Referral Fee Amount Display */}
      {referralFeeAmount > 0 && (
        <div className="mb-8 bg-canvas-cream border border-pine-shadow-20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Info size={20} className="text-pine-shadow-60" />
            <div>
              <span className="text-sm text-pine-shadow">Referral Fee Amount: </span>
              <span className="text-sm font-medium text-midnight-koi">
                {formatUsd(referralFeeAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Display */}
      {/* Removed as per user request */}

      <TipCategoryDisplay control={control} />
      {/* Only show balance/deposit card if not too big */}
      {!isTooBig && <BalanceCheck control={control} trackDepositKSM={trackDepositKSM} />}
    </div>
  )
}

const TipCategoryDisplay: FC<{ control: TipControlType }> = ({ control }) => {
  const tipAmount = useWatch({ control, name: "tipAmount" })
  const currencyRate = useStateObservable(currencyRate$)
  const selectedChain = useStateObservable(selectedChain$)
  const chainConfig = CHAINS[selectedChain]
  const stablecoin = useWatch({ control, name: "stablecoin" })

  const tipCategory = useMemo(() => {
    const tipAmountValue = parseNumber(tipAmount) || 0

    if (tipAmountValue === 0) {
      return null
    }

    // For Polkadot + stablecoin, use USD thresholds
    if (selectedChain === "DOT" && stablecoin) {
      if (tipAmountValue <= 2500) {
        return { category: "Small Tipper", color: "text-lilypad" }
      } else if (tipAmountValue <= 10000) {
        return { category: "Big Tipper", color: "text-sun-bleach" }
      } else {
        return { category: "Too big for a tip request", color: "text-tomato-stamp" }
      }
    }

    // Default: use token logic
    if (!currencyRate) {
      return null
    }
    const tipAmountToken = tipAmountValue / currencyRate
    if (tipAmountToken <= chainConfig.smallTipperLimit) {
      return { category: "Small Tipper", color: "text-lilypad" }
    } else if (tipAmountToken <= chainConfig.bigTipperLimit) {
      return { category: "Big Tipper", color: "text-sun-bleach" }
    } else {
      return { category: "Too big for a tip request", color: "text-tomato-stamp" }
    }
  }, [tipAmount, currencyRate, chainConfig, selectedChain, stablecoin])

  if (!tipCategory) {
    return null
  }

  return (
    <div className="mb-8 bg-canvas-cream border border-pine-shadow-20 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Info size={20} className="text-pine-shadow-60" />
        <div>
          <span className="text-sm text-pine-shadow">Tip Category: </span>
          <span className={`text-sm font-medium ${tipCategory.color}`}>
            {tipCategory.category}
          </span>
        </div>
      </div>
    </div>
  )
}

const BalanceCheck: FC<{ control: TipControlType; trackDepositKSM: string | null }> = ({ control, trackDepositKSM }) => {
  const tipAmount = useWatch({ control, name: "tipAmount" })
  const referralFeePercent = useWatch({ control, name: "referralFeePercent" })
  const tipperTrack = useWatch({ control, name: "tipperTrack" })
  const currencyRate = useStateObservable(currencyRate$)
  const estimatedCost = useStateObservable(estimatedCost$)
  const selectedAccount = useStateObservable(selectedAccount$)
  const currentBalance = useStateObservable(signerBalance$)
  const selectedChain = useStateObservable(selectedChain$)
  const chainConfig = CHAINS[selectedChain]

  useEffect(() => {
    const formValuesForTotals: DeepPartialSkipArrayKey<FormSchema> = {
      tipAmount: parseNumber(tipAmount) ?? undefined,
      referralFeePercent: parseNumber(referralFeePercent) ?? undefined,
    }
    const { totalAmountToken } = calculatePriceTotals(formValuesForTotals)
    // Only set tip value if there's a tip amount, otherwise estimatedCost might show a value based on 0 USD
    if ((parseNumber(tipAmount) || 0) > 0) {
      setTipValue(totalAmountToken)
    } else {
      setTipValue(null) // Reset estimated cost if tip amount is cleared or zero
    }
  }, [tipAmount, referralFeePercent, currencyRate])

  const tipAmountValue = parseNumber(tipAmount) || 0

  // Decision deposit override for DOT
  let decisionDepositDisplay = trackDepositKSM
  if (selectedChain === "DOT") {
    if (tipperTrack === "small_tipper") {
      decisionDepositDisplay = "1 DOT"
    } else if (tipperTrack === "big_tipper") {
      decisionDepositDisplay = "10 DOT"
    }
  }

  const renderSpecificBalanceMessages = () => {
    // This function is only called when tipAmountValue > 0 and estimatedCost is available.
    // So, estimatedCost is guaranteed to be non-null here.

    if (!selectedAccount) {
      return (
        <div className="flex items-center gap-2 mt-2">
          <button type="button" className="poster-btn btn-secondary py-1 px-3 text-sm" onClick={openSelectAccount}>
            Connect Wallet
          </button>
          <span className="text-pine-shadow text-sm">to check if you have sufficient balance.</span>
        </div>
      )
    }
    if (currentBalance == null) {
      // It's possible selectedAccount is set, but balance is still fetching
      return <div className="text-pine-shadow-60 mt-2 text-sm">Fetching your balance...</div>
    }

    // estimatedCost is confirmed non-null by the calling condition
    const totalCost = estimatedCost!.deposits + estimatedCost!.fees

    if (currentBalance < totalCost) {
      return (
        <div className="poster-alert alert-error flex items-center gap-3 mt-2">
          <TriangleAlert size={20} className="shrink-0" />
          <div className="text-sm">
            <strong>Uh-oh:</strong> not enough balance ({formatToken(currentBalance)}). Please add funds or select
            another wallet.
          </div>
        </div>
      )
    }
    return (
      <div className="poster-alert alert-success flex items-center gap-3 mt-2">
        <CheckCircle2 size={20} className="shrink-0 text-lilypad" />
        <div className="text-sm">
          <strong>Nice:</strong> you have enough balance ({formatToken(currentBalance)}) to submit the tip referendum 🚀
        </div>
      </div>
    )
  }

  return (
    <div className="bg-canvas-cream border border-pine-shadow-20 rounded-lg p-6">
      <p className="text-pine-shadow leading-relaxed mb-4">
        Please note that you'll need a minimum of {decisionDepositDisplay ?? '...'} to submit the tip referendum. (You'll get your deposit back once the referendum ends.)
      </p>

      {tipAmountValue > 0 && estimatedCost && renderSpecificBalanceMessages()}
    </div>
  )
}

