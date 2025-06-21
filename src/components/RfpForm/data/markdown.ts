import { TOKEN_SYMBOL } from "@/constants"
import type { DeepPartialSkipArrayKey } from "react-hook-form"
import {
  type FormSchema,
  parseNumber,
  type RfpControlType,
  formSchema,
} from "../formSchema"

export function generateMarkdown(
  data: DeepPartialSkipArrayKey<FormSchema>,
  totalAmountToken: number | null,
  identities: Record<string, string | undefined>,
) {
  // Don't require full validation - work with partial data
  console.log("Generating markdown with data:", data)
  console.log("Total amount in tokens:", totalAmountToken)
  console.log("Identities:", identities)

  // Extract values with fallbacks
  const projectTitle = data.projectTitle || "Untitled Project"
  const prizePool = parseNumber(data.prizePool) || 0
  const findersFeePercent = parseNumber(data.findersFeePercent) || 0
  const supervisorsFee = parseNumber(data.supervisorsFee) || 0
  const tipBeneficiary = data.beneficiary || ""
  const referral = data.finder || ""
  const projectScope = data.projectScope || ""

  // Calculate finder's fee amount from percentage
  const findersFeeAmount = (prizePool * findersFeePercent) / 100

  // Generate markdown even with partial data
  const markdown = `# ${projectTitle}
Total Requested: $${(prizePool + findersFeeAmount).toLocaleString()}

Prize Pool: $${prizePool.toLocaleString()} + Finder's Fee: $${findersFeeAmount.toLocaleString()} (${findersFeePercent}%)

${totalAmountToken ? Math.round(totalAmountToken).toLocaleString() : "TBD"
    } ${TOKEN_SYMBOL} Requested

## Beneficiaries

**Tip Beneficiary:** ${tipBeneficiary ? (identities[tipBeneficiary] || tipBeneficiary) : "TBD"}

**Referral:** ${referral ? (identities[referral] || referral) : "TBD"}

## Project Scope

${projectScope || "Project scope to be defined..."}
`

  console.log("Generated markdown:", markdown)
  return markdown
}

