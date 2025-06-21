"use client"

import { getPublicKey, sliceMiddleAddr } from "@/lib/ss58"
import { CopyText, PolkadotIdenticon } from "@polkadot-api/react-components"
import { useStateObservable } from "@react-rxjs/core"
import { CheckCircle } from "lucide-react"
import { getSs58AddressInfo } from "polkadot-api"
import { type FC, useState, useEffect } from "react"
import { type ControllerRenderProps, useWatch } from "react-hook-form"
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { identity$ } from "./data"
import type { FormSchema, RfpControlType } from "./formSchema"
import { selectedAccount$ } from "../SelectAccount"
import { encodeAddress } from "@polkadot/util-crypto"
import { FormInputField } from "./FormInputField"

const KUSAMA_SS58_PREFIX = 2

export const BeneficiariesSection: FC<{ control: RfpControlType }> = ({ control }) => {
  const beneficiaries = useWatch({ name: "beneficiaries", control })
  const selectedAccount = useStateObservable(selectedAccount$)

  // Set default referral to connected address when component mounts
  useEffect(() => {
    if (selectedAccount && (!beneficiaries?.referral || beneficiaries.referral === "")) {
      // This will be handled by the form field's setValue
    }
  }, [selectedAccount, beneficiaries?.referral])

  return (
    <div className="poster-card">
      <h3 className="text-3xl font-medium mb-8 text-midnight-koi">Beneficiaries</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormInputField control={control} name="beneficiary" label="Beneficiary" description="who will get the prize" />
        <FormInputField control={control} name="finder" label="Finder" description="who will get the finder's fee" />
      </div>
    </div>
  )
}

interface BeneficiaryControlProps {
  field: ControllerRenderProps<FormSchema, "beneficiaries.tipBeneficiary" | "beneficiaries.referral">
  label: string
  description: string
  placeholder: string
  defaultValue?: string
}

const BeneficiaryControl: FC<BeneficiaryControlProps> = ({ field, label, description, placeholder, defaultValue }) => {
  const [addrInvalid, setAddrInvalid] = useState(false)
  const [isAddressValid, setIsAddressValid] = useState(false)

  // Set default value when component mounts
  useEffect(() => {
    if (defaultValue && (!field.value || field.value === "")) {
      field.onChange(defaultValue)
    }
  }, [defaultValue, field.value, field.onChange])

  // Validate address whenever field.value changes
  useEffect(() => {
    if (!field.value) {
      setAddrInvalid(false)
      setIsAddressValid(false)
      return
    }

    try {
      const info = getSs58AddressInfo(field.value)
      setAddrInvalid(!info.isValid)
      setIsAddressValid(info.isValid)
    } catch {
      setAddrInvalid(true)
      setIsAddressValid(false)
    }
  }, [field.value])

  const handleAddressChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newAddr = evt.target.value
    field.onChange(newAddr)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-lg font-medium text-midnight-koi mb-2 block">{label}</label>
        <p className="text-base text-pine-shadow/60 mb-4">{description}</p>
      </div>
      <div className="space-y-4">
        <Input
          placeholder={placeholder}
          value={field.value || ""}
          onChange={handleAddressChange}
          aria-invalid={addrInvalid}
          className="vintage-input"
        />
        {isAddressValid && (
          <div className="p-4 budget-card">
            <AddressIdentity addr={field.value} />
          </div>
        )}
        {addrInvalid && field.value ? (
          <div className="alert-box alert-danger">
            <div className="text-base">Value is not a valid address.</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const AddressIdentity: FC<{ addr: string }> = ({ addr }) => {
  const identity = useStateObservable(identity$(addr))

  // Add additional safety check
  if (!addr) {
    return null
  }

  try {
    const publicKey = getPublicKey(addr)

    return (
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <CopyText text={addr} copiedContent={<CheckCircle size={18} className="text-lilypad-dark w-8" />}>
          <PolkadotIdenticon size={36} publicKey={publicKey} />
        </CopyText>
        {identity ? (
          identity.verified ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">{identity.value}</span>
              <CheckCircle size={18} className="text-lilypad-dark" />
            </div>
          ) : (
            <div className="leading-tight">
              <div className="text-lg font-medium">{identity.value}</div>
              <div className="text-base text-pine-shadow/60">{sliceMiddleAddr(addr)}</div>
            </div>
          )
        ) : (
          <span className="text-base text-pine-shadow/60 overflow-hidden text-ellipsis">{sliceMiddleAddr(addr)}</span>
        )}
      </div>
    )
  } catch (error) {
    // If getPublicKey fails, don't render the component
    return null
  }
}

