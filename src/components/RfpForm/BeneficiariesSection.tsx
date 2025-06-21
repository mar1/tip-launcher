"use client"

import { type FC, useEffect } from "react"
import { useWatch } from "react-hook-form"
import type { TipControlType } from "./formSchema"
import { selectedAccount$ } from "../SelectAccount"
import { FormInputField } from "./FormInputField"
import { useStateObservable } from "@react-rxjs/core"

export const BeneficiariesSection: FC<{ control: TipControlType }> = ({ control }) => {
  const referral = useWatch({ name: "referral", control })
  const selectedAccount = useStateObservable(selectedAccount$)

  // Set default referral to connected address when component mounts
  useEffect(() => {
    if (selectedAccount && (!referral || referral === "")) {
      // This will be handled by the form field's setValue
    }
  }, [selectedAccount, referral])

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Recipients</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormInputField control={control} name="tipBeneficiary" label="Tip Recipient" description="who will receive the tip" />
        <FormInputField control={control} name="referral" label="Referral" description="who will receive the referral fee" />
      </div>
    </div>
  )
}

