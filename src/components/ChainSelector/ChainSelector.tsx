import { CHAINS, type ChainType } from "@/constants"
import { useStateObservable } from "@react-rxjs/core"
import { ChevronDown } from "lucide-react"
import { type FC } from "react"
import { selectedChain$, updateSelectedChain } from "@/components/ChainSelector/chain.state"

export const ChainSelector: FC = () => {
    const selectedChain = useStateObservable(selectedChain$) as ChainType
    const chainConfig = CHAINS[selectedChain]

    // Dynamic background color
    const bgColor = selectedChain === "DOT" ? "#FF2670" : "#000"

    return (
        <div className="relative inline-block">
            <select
                value={selectedChain}
                onChange={(e) => {
                    const newChain = e.target.value as ChainType
                    updateSelectedChain(newChain)
                }}
                className="appearance-none kusama-stamp border-none text-white font-inherit cursor-pointer pr-8 pl-4 py-2 focus:outline-none"
                style={{
                    minWidth: 120,
                    paddingRight: "2.5rem", // extra space for the arrow
                    background: bgColor,
                }}
            >
                {Object.entries(CHAINS).map(([chainKey, chainConfig]) => (
                    <option key={chainKey} value={chainKey}>
                        {chainConfig.name}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
                size={18}
            />
        </div>
    )
}