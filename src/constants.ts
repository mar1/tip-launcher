export const BLOCK_LENGTH = 6
export const KRAKEN_SYMBOL_PAIR = "KSMUSD"
export const TOKEN_SYMBOL = "KSM"
export const TOKEN_DECIMALS = 12
export const CHOPSTICKS_URL = `http://localhost:8133`

// Light client disabled while https://github.com/paritytech/litep2p/pull/393, which can cause transactions through smoldot to not get included in blocks.
export const FEATURE_LIGHT_CLIENT = false

export const REMARK_TEXT = "unused funds from the bounty will be returned to the treasury"

// 70s-90s Poster-Core Design System
export const POSTER_COLORS = {
  canvasCream: "#F8F3E7",
  lakeHaze: "#BFD7D2",
  sunBleach: "#F2D6A0",
  pineShadow: "#4C6659",
  midnightKoi: "#2A2A2A",
  tomatoStamp: "#D45D5D",
  lilypad: "#8AA580",
} as const

// Grid System
export const GRID = {
  columns: 12,
  maxColumnWidth: 72, // px
  gutters: 24, // px
  marginDesktop: 96, // px
  marginMobile: 16, // px
  mobileColumns: 4,
  mobileGutters: 16, // px
} as const

// Typography Scale
export const TYPE_SCALE = {
  letterSpacingHeaders: "0.02em",
  lineHeightBody: "1.55em",
  transitionDuration: "150ms",
  hoverLift: "4px",
} as const

