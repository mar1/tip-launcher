import type { Control } from "react-hook-form"
import { z } from "zod"

const requiredString = z.string().min(1, "This field is required")
const optionalAddress = z.string().optional()

export const formSchema = z.object({
  // Scope
  projectTitle: requiredString,
  projectScope: requiredString,

  // Funding
  prizePool: z.number().min(0, "Prize pool must be a positive number"),
  findersFeePercent: z.number().min(0).max(100).optional(),
  supervisorsFee: z.number().min(0).optional(),

  // Beneficiaries
  beneficiary: requiredString,
  finder: optionalAddress,
})

export const parseNumber = (value: string | number | undefined) => {
  try {
    return z.coerce.number().parse(value)
  } catch (_) {
    return null
  }
}

// zod with .coerce can work with strings, but TS complains.
export const emptyNumeric = "" as unknown as number

export type FormSchema = z.infer<typeof formSchema>

export type RfpFormContext = unknown
export type RfpControlType = Control<FormSchema, RfpFormContext, FormSchema>

