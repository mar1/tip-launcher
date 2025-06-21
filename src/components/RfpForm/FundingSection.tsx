"use client"

import { formatToken, formatUsd } from "@/lib/formatToken"
import { useStateObservable } from "@react-rxjs/core"
import { TriangleAlert, CheckCircle2, Info } from "lucide-react"
import { type FC, useEffect, useMemo } from "react"
import { useWatch, type DeepPartialSkipArrayKey, useFormContext } from "react-hook-form"
import { openSelectAccount, selectedAccount$ } from "../SelectAccount"
import { estimatedCost$, signerBalance$ } from "./data"
import { calculatePriceTotals, setBountyValue } from "./data/price"
import { currencyRate$ } from "@/services/currencyRate"
import { FormInputField } from "./FormInputField"
import { type RfpControlType, type FormSchema, parseNumber } from "./formSchema"

export const FundingSection: FC<{ control: RfpControlType }> = ({ control }) => {
  const prizePool = useWatch({ control, name: "prizePool" })
  const findersFeePercent = useWatch({ control, name: "findersFeePercent" })

  // Calculate finder's fee amount from percentage
  const findersFeeAmount = useMemo(() => {
    const prizePoolAmount = parseNumber(prizePool) || 0
    const feePercent = parseNumber(findersFeePercent) || 0
    return (prizePoolAmount * feePercent) / 100
  }, [prizePool, findersFeePercent])

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Funding</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <FormInputField
          control={control}
          name="prizePool"
          label="Prize Pool (USD)"
          description="amount awarded to implementors"
          type="number"
        />
        <FormInputField
          control={control}
          name="findersFeePercent"
          label="Finder's Fee (%)"
          description="percentage of prize pool awarded to the referral"
          type="number"
          min={0}
          max={100}
          step={0.1}
        />
      </div>

      {/* Finder's Fee Amount Display */}
      {findersFeeAmount > 0 && (
        <div className="mb-8 bg-canvas-cream border border-pine-shadow-20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Info size={20} className="text-pine-shadow-60" />
            <div>
              <span className="text-sm text-pine-shadow">Finder's Fee Amount: </span>
              <span className="text-sm font-medium text-midnight-koi">
                {formatUsd(findersFeeAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      <TipCategoryDisplay control={control} />
      <BalanceCheck control={control} />
    </div>
  )
}

const TipCategoryDisplay: FC<{ control: RfpControlType }> = ({ control }) => {
  const prizePool = useWatch({ control, name: "prizePool" })
  const currencyRate = useStateObservable(currencyRate$)

  const tipCategory = useMemo(() => {
    const prizePoolAmount = parseNumber(prizePool) || 0

    if (prizePoolAmount === 0 || !currencyRate) {
      return null
    }

    const prizePoolKSM = prizePoolAmount / currencyRate

    if (prizePoolKSM <= 8.25) {
      return { category: "Small Tipper", color: "text-lilypad" }
    } else if (prizePoolKSM <= 33.33) {
      return { category: "Big Tipper", color: "text-sun-bleach" }
    } else {
      return { category: "Too big for a tip request", color: "text-tomato-stamp" }
    }
  }, [prizePool, currencyRate])

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

const BalanceCheck: FC<{ control: RfpControlType }> = ({ control }) => {
  const prizePool = useWatch({ control, name: "prizePool" })
  const findersFeePercent = useWatch({ control, name: "findersFeePercent" })
  const supervisorsFee = useWatch({ control, name: "supervisorsFee" })

  const currencyRate = useStateObservable(currencyRate$)
  const estimatedCost = useStateObservable(estimatedCost$)
  const selectedAccount = useStateObservable(selectedAccount$)
  const currentBalance = useStateObservable(signerBalance$)

  useEffect(() => {
    const formValuesForTotals: DeepPartialSkipArrayKey<FormSchema> = {
      prizePool: parseNumber(prizePool) ?? undefined,
      findersFeePercent: parseNumber(findersFeePercent) ?? undefined,
    }
    const { totalAmountToken } = calculatePriceTotals(formValuesForTotals)
    // Only set bounty value if there's a prize pool, otherwise estimatedCost might show a value based on 0 USD
    if ((parseNumber(prizePool) || 0) > 0) {
      setBountyValue(totalAmountToken)
    } else {
      setBountyValue(null) // Reset estimated cost if prize pool is cleared or zero
    }
  }, [prizePool, findersFeePercent, currencyRate])

  const prizePoolAmount = parseNumber(prizePool) || 0

  const renderSpecificBalanceMessages = () => {
    // This function is only called when prizePoolAmount > 0 and estimatedCost is available.
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
          <strong>Nice:</strong> you have enough balance ({formatToken(currentBalance)}) to launch the RFP 🚀
        </div>
      </div>
    )
  }

  return (
    <div className="bg-canvas-cream border border-pine-shadow-20 rounded-lg p-6">
      <p className="text-pine-shadow leading-relaxed mb-4">
        Please note that you'll need a minimum of{" "}
        {prizePoolAmount > 0 ? (
          estimatedCost ? (
            <strong className="text-midnight-koi font-semibold">
              {formatToken(estimatedCost.deposits + estimatedCost.fees)}
            </strong>
          ) : (
            <span className="text-pine-shadow-60">(calculating based on inputs…)</span>
          )
        ) : (
          <span className="text-pine-shadow-60">(enter prize pool to see cost)</span>
        )}
        {prizePoolAmount > 0 && estimatedCost && (
          <>
            {" "}
            to submit the RFP ({formatToken(estimatedCost.fees)} in fees. You'll get{" "}
            {formatToken(estimatedCost.deposits)} in deposits back once the RFP ends).
          </>
        )}
      </p>
      {prizePoolAmount > 0 && estimatedCost && <div>{renderSpecificBalanceMessages()}</div>}
    </div>
  )
}

