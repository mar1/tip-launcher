import { state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { type ChainType } from "@/constants"

// Create a signal for updating the chain
const [updateSelectedChain$, updateSelectedChain] = createSignal<ChainType>()

// State observable for react-rxjs with default value
export const selectedChain$ = state(updateSelectedChain$, "KSM" as ChainType)

// Export the update function
export { updateSelectedChain }