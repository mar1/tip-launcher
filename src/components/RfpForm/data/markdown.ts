import { REFERENDUM_PRICE_BUFFER, TOKEN_SYMBOL } from "@/constants"
import type { DeepPartialSkipArrayKey } from "react-hook-form"
import {
  type FormSchema,
  parseNumber,
  type RfpControlType,
  formSchema,
} from "../formSchema"

export function generateMarkdown(
  data: DeepPartialSkipArrayKey<FormSchema>,
  totalAmountWithBuffer: number | null,
  identities: Record<string, string | undefined>,
) {
  // Don't require full validation - work with partial data
  console.log("Generating markdown with data:", data)
  console.log("Total amount with buffer:", totalAmountWithBuffer)
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

Prize Pool: $${prizePool.toLocaleString()}
Finder's Fee: $${findersFeeAmount.toLocaleString()} (${findersFeePercent}%)
Supervisor's Fee: $${supervisorsFee.toLocaleString()}

${totalAmountWithBuffer ? Math.round(totalAmountWithBuffer).toLocaleString() : "TBD"
    } ${TOKEN_SYMBOL} Requested (Amount + ${REFERENDUM_PRICE_BUFFER * 100}%)

## Beneficiaries

**Tip Beneficiary:** ${tipBeneficiary ? (identities[tipBeneficiary] || tipBeneficiary) : "TBD"}
**Referral:** ${referral ? (identities[referral] || referral) : "TBD"}

Excess or unused funds will be returned to the treasury.

## Project Scope

${projectScope || "Project scope to be defined..."}
`

  console.log("Generated markdown:", markdown)
  return markdown
}

