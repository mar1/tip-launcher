import { TOKEN_SYMBOL, CHAINS, type ChainType } from "@/constants"
import type { DeepPartialSkipArrayKey } from "react-hook-form"
import {
  type FormSchema,
  parseNumber,
} from "../formSchema"
import { selectedChain$ } from "@/components/ChainSelector/chain.state"

export function generateMarkdown(
  data: DeepPartialSkipArrayKey<FormSchema>,
  totalAmountToken: number | null,
  identities: Record<string, string | undefined>,
) {
  const selectedChain = selectedChain$.getValue() as ChainType
  const chainConfig = CHAINS[selectedChain]

  // Don't require full validation - work with partial data
  console.log("Generating markdown with data:", data)
  console.log("Total amount in tokens:", totalAmountToken)
  console.log("Identities:", identities)

  // Extract values with fallbacks
  const tipTitle = data.tipTitle || "Untitled Tip"
  const tipAmount = parseNumber(data.tipAmount) || 0
  const referralFeePercent = parseNumber(data.referralFeePercent) || 0
  const tipBeneficiary = data.tipBeneficiary || ""
  const referral = data.referral || ""
  const tipDescription = data.tipDescription || ""

  // Calculate referral fee amount from percentage
  const referralFeeAmount = (tipAmount * referralFeePercent) / 100

  // Generate markdown even with partial data
  const markdown = `# ${tipTitle}
Total Requested: $${(tipAmount + referralFeeAmount).toLocaleString()}

Tip Amount: $${tipAmount.toLocaleString()} + Referral Fee: $${referralFeeAmount.toLocaleString()} (${referralFeePercent}%)

${totalAmountToken ? Math.round(totalAmountToken).toLocaleString() : "TBD"
    } ${chainConfig.symbol} Requested

## Recipients

**Tip Recipient:** ${tipBeneficiary ? (identities[tipBeneficiary] || tipBeneficiary) : "TBD"}

**Referral:** ${referral ? (identities[referral] || referral) : "TBD"}

## Tip Description

${tipDescription || "Tip description to be defined..."}

---
*This tip request was created using the Tip Referendum Launcher*
`

  console.log("Generated markdown:", markdown)
  return markdown
}

