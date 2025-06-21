"use client"

import { TOKEN_SYMBOL } from "@/constants"
import { formatCurrency, formatToken, formatUsd } from "@/lib/formatToken"
import { getPublicKey, sliceMiddleAddr } from "@/lib/ss58"
import { currencyRate$ } from "@/services/currencyRate"
import { PolkadotIdenticon } from "@polkadot-api/react-components"
import { useStateObservable } from "@react-rxjs/core"
import {
  BadgeInfo,
  TriangleAlert,
  FileText,
  DollarSign,
  Users,
  CheckCircle2,
  Copy,
  CheckCircle,
  AlertCircle,
  ArrowLeftCircle,
} from "lucide-react"
import { type FC, useEffect, useState, useMemo, type Dispatch, type SetStateAction } from "react"
import { useWatch } from "react-hook-form"
import { combineLatest, map } from "rxjs"
import { Checkbox } from "../ui/checkbox"
import { identity$ } from "./data"
import { calculatePriceTotals, setBountyValue } from "./data/price"
import { generateMarkdown } from "./data/markdown"
import { MarkdownPreview } from "./MarkdownPreview"
import { parseNumber, type RfpControlType } from "./formSchema"
import { selectedAccount$ } from "../SelectAccount"

interface ReviewSectionProps {
  control: RfpControlType
  isReturnFundsAgreed: boolean
  setIsReturnFundsAgreed: Dispatch<SetStateAction<boolean>>
  hasSufficientBalance: boolean
  currentBalance: bigint | null
  totalRequiredCost: bigint | null
  navigateToStep: (stepId: string) => void
}

export const ReviewSection: FC<ReviewSectionProps> = ({
  control,
  isReturnFundsAgreed,
  setIsReturnFundsAgreed,
  hasSufficientBalance,
  currentBalance,
  totalRequiredCost,
  navigateToStep,
}) => {
  const selectedAccount = useStateObservable(selectedAccount$)

  const { beneficiary: tipBeneficiary, finder: referral } = useWatch({ control })

  const hasBeneficiaries = !!(tipBeneficiary && referral)

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Review & Submit</h3>

      {/* Insufficient Balance Warning */}
      {selectedAccount && !hasSufficientBalance && totalRequiredCost !== null && (
        <div className="mb-6 poster-alert alert-error">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <strong>Insufficient Balance:</strong> You need at least{" "}
              <strong className="font-semibold">{formatToken(totalRequiredCost)}</strong> to launch this RFP. Your
              current balance is <strong className="font-semibold">{formatToken(currentBalance)}</strong>. Please add
              funds or select another wallet.
            </div>
          </div>
        </div>
      )}

      {/* Summary Grid - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FundingSummary
          control={control}
          navigateToStep={navigateToStep}
        />
        <ProjectSummary
          control={control}
          hasBeneficiaries={hasBeneficiaries}
          navigateToStep={navigateToStep}
        />
      </div>

      {/* Markdown Preview */}
      <ResultingMarkdown control={control} />

      {/* Final Confirmation */}
    </div>
  )
}

const FundingSummaryListItem: FC<{
  label: string
  value: string | number | null | undefined
  isSubItem?: boolean
  valueClass?: string
  labelClass?: string
}> = ({ label, value, isSubItem, valueClass, labelClass }) => (
  <div className={`flex justify-between items-baseline ${isSubItem ? "pl-4" : ""}`}>
    <span className={`text-sm ${isSubItem ? "text-pine-shadow-60" : "text-pine-shadow"} ${labelClass}`}>{label}</span>
    <span className={`font-medium text-midnight-koi tabular-nums ${isSubItem ? "text-xs" : ""} ${valueClass}`}>
      {value}
    </span>
  </div>
)

const FundingSummary: FC<{
  control: RfpControlType
  navigateToStep: (stepId: string) => void
}> = ({ control, navigateToStep }) => {
  const formFields = useWatch({ control })
  const currencyRate = useStateObservable(currencyRate$)
  const { totalAmountToken } = calculatePriceTotals(formFields)

  useEffect(() => {
    setBountyValue(totalAmountToken)
  }, [totalAmountToken])

  const formattedKsmString = formatCurrency(totalAmountToken, TOKEN_SYMBOL, 2)
  let ksmValueDisplay = "Calculating..."
  let ksmUnitDisplay = ""

  if (totalAmountToken != null && formattedKsmString) {
    const parts = formattedKsmString.split(" ")
    if (parts.length >= 1) {
      ksmValueDisplay = parts[0]
      if (parts.length >= 2) {
        ksmUnitDisplay = parts[1]
      } else {
        const symbolIndex = ksmValueDisplay.indexOf(TOKEN_SYMBOL)
        if (symbolIndex > -1 && ksmValueDisplay.endsWith(TOKEN_SYMBOL)) {
          ksmUnitDisplay = TOKEN_SYMBOL
          ksmValueDisplay = ksmValueDisplay.substring(0, symbolIndex).trim()
        } else {
          ksmUnitDisplay = TOKEN_SYMBOL
        }
      }
    }
  }

  // Calculate finder's fee amount from percentage
  const prizePool = parseNumber(formFields.prizePool) || 0
  const findersFeePercent = parseNumber(formFields.findersFeePercent) || 0
  const findersFeeAmount = (prizePool * findersFeePercent) / 100

  return (
    <div className="bg-canvas-cream border border-lake-haze rounded-lg p-6">
      <h4 className="flex items-center gap-2 text-lg font-medium text-midnight-koi mb-4">
        <DollarSign size={20} className="text-lake-haze" />
        Funding Breakdown
      </h4>

      <div className="space-y-3">
        <FundingSummaryListItem label="Prize Pool" value={formatUsd(formFields.prizePool)} />

        <FundingSummaryListItem label="Finder's Fee" value={formatUsd(findersFeeAmount)} />

        {/* Total Section */}
        <div className="pt-4 mt-4 border-t-2 border-lake-haze">
          <div className="flex justify-between items-start">
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold text-midnight-koi">Total</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xl font-bold text-midnight-koi tabular-nums">{ksmValueDisplay}</span>
              {ksmUnitDisplay && <span className="text-xs text-pine-shadow-60">{ksmUnitDisplay}</span>}
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-pine-shadow-60 mt-1 tabular-nums">
          1 {TOKEN_SYMBOL} = {formatCurrency(currencyRate, "USD")}
        </div>
      </div>
    </div>
  )
}

const ProjectSummary: FC<{
  control: RfpControlType
  hasBeneficiaries: boolean
  navigateToStep: (stepId: string) => void
}> = ({ control, hasBeneficiaries, navigateToStep }) => {
  const formFields = useWatch({ control })
  const tipBeneficiary = formFields.beneficiary || ""
  const referral = formFields.finder || ""

  return (
    <div className="bg-canvas-cream border border-lilypad rounded-lg p-6">
      <h4 className="flex items-center gap-2 text-lg font-medium text-midnight-koi mb-4">
        <Users size={20} className="text-lilypad" />
        Project Summary
      </h4>

      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium text-pine-shadow-60 uppercase tracking-wide mb-1">Project Title</div>
          <div className="text-sm font-medium text-midnight-koi break-words">
            {formFields.projectTitle || "Untitled Project"}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-pine-shadow-60 uppercase tracking-wide mb-1">Beneficiaries</div>
          <div className="text-sm text-pine-shadow">
            {hasBeneficiaries ? "2 beneficiaries configured" : "None"}
          </div>
          {hasBeneficiaries && (
            <ul className="mt-1 space-y-0.5">
              <li>
                <div className="text-xs text-pine-shadow-60 mb-1">Tip Beneficiary:</div>
                <BeneficiaryListItem address={tipBeneficiary} />
              </li>
              <li>
                <div className="text-xs text-pine-shadow-60 mb-1">Referral:</div>
                <BeneficiaryListItem address={referral} />
              </li>
            </ul>
          )}
        </div>

        <div className="pt-3 border-t border-pine-shadow-20">
          {hasBeneficiaries ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-lilypad" />
              <span className="text-sm text-pine-shadow font-medium">Ready for Submission</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-tomato-stamp">
              <TriangleAlert size={16} />
              <span className="text-sm font-medium">Beneficiaries Required.</span>
              <button
                type="button"
                onClick={() => navigateToStep("beneficiaries")}
                className="inline-flex items-center gap-1 underline text-tomato-stamp hover:text-midnight-koi text-sm font-medium"
              >
                <ArrowLeftCircle size={14} />
                Fix
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const BeneficiaryListItem: FC<{ address: string | undefined }> = ({ address }) => {
  if (!address) return null

  const identity = useStateObservable(identity$(address))

  return (
    <div className="flex items-center gap-2 text-sm text-pine-shadow">
      <PolkadotIdenticon size={16} publicKey={getPublicKey(address)} />
      {identity ? (
        identity.verified ? (
          <div className="flex items-center gap-1">
            <span className="font-medium">{identity.value}</span>
            <CheckCircle size={12} className="text-lilypad-dark" />
          </div>
        ) : (
          <span className="font-medium">{identity.value}</span>
        )
      ) : (
        <span className="font-mono text-xs">{sliceMiddleAddr(address)}</span>
      )}
    </div>
  )
}

const ResultingMarkdown: FC<{
  control: RfpControlType
}> = ({ control }) => {
  const [identities, setIdentities] = useState<Record<string, string | undefined>>({})
  const formFields = useWatch({ control })

  useEffect(() => {
    const tipBeneficiary = formFields.beneficiary
    const referral = formFields.finder
    if (!tipBeneficiary && !referral) {
      setIdentities({})
      return
    }

    const addresses = [tipBeneficiary, referral].filter(Boolean) as string[]
    const subscription = combineLatest(
      Object.fromEntries(addresses.map((addr) => [addr, identity$(addr).pipe(map((id) => id?.value))])),
    ).subscribe((r) => setIdentities(r))
    return () => subscription.unsubscribe()
  }, [formFields.beneficiary, formFields.finder])

  const markdown = useMemo(() => {
    const { totalAmountToken } = calculatePriceTotals(formFields)
    return generateMarkdown(formFields, totalAmountToken, identities)
  }, [formFields, identities])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      // Simple success feedback
      console.log("Markdown copied to clipboard")
    } catch (err) {
      console.error("Failed to copy markdown:", err)
      // Fallback copy method
      const textArea = document.createElement("textarea")
      textArea.value = markdown
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        console.log("Markdown copied to clipboard (fallback)")
      } catch (execErr) {
        console.error("Fallback copy failed:", execErr)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h4 className="flex items-center gap-2 text-lg font-medium text-midnight-koi">
          <FileText size={20} className="text-tomato-stamp" />
          Tip Request Body Preview
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="poster-btn btn-primary flex items-center gap-1 text-xs py-2 px-3"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
      </div>

      <MarkdownPreview markdown={markdown} />

      <div className="mt-4 poster-alert alert-warning">
        <div className="flex items-start gap-2">
          <BadgeInfo size={16} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <strong>Next Step:</strong> Copy this Markdown content and paste it into the body of your referendum once
            submitted.
          </div>
        </div>
      </div>
    </div>
  )
}

