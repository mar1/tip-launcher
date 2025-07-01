import { USE_CHOPSTICKS } from "@/chain"
import { ChopsticksController } from "./ChopsticksController"
import { SelectAccount } from "./SelectAccount"
import { ChainSelector } from "./ChainSelector"

export const Header = () => {
  return (
    <header className="poster-header">
      <div className="poster-header-content">
        {/* This div is now the flex-row container for the logo and the text block */}
        <div className="flex flex-row items-center gap-3">
          <img
            src={import.meta.env.BASE_URL + "logo.svg"}
            alt="Tip Referendum Launcher Logo"
            className="h-14 w-auto"
          />
          <div className="poster-brand">
            <h1 className="poster-brand-title">Tip Referendum Launcher</h1>
            <div className="poster-brand-subtitle">Big Tipper & Small Tipper Tracks</div>
          </div>
        </div>

        <div className="poster-actions">
          <ChainSelector />
          <SelectAccount />
          {USE_CHOPSTICKS && <ChopsticksController />}
        </div>
      </div>
    </header>
  )
}

