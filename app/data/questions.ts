export type QuizOption = string;

export interface QuizQuestion {
  id: number;
  category: string;
  question: string;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  litepaperRef: string;
}

export const PASS_SCORE = 5;
export const ROUND_SIZE = 10;
export const TIME_PER_QUESTION_SEC = 20;
export const LITEPAPER_URL = "https://pmm.melee.markets/litepaper";

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: "PMM Foundations",
    question: "What is the Parimutuel Market Maker (PMM) at its core?",
    options: [
      "A central limit order book that needs professional market makers quoting",
      "An evolved parimutuel with co-adaptive curves, return floors and paired cashout",
      "An AMM designed for persistent tokens, like a Uniswap liquidity pool",
      "An LMSR market run by a subsidized operator absorbing losses",
    ],
    answerIndex: 1,
    explanation:
      "The PMM keeps the parimutuel foundation — peer-to-peer settlement, first-dollar liquidity — and adds co-adaptive pricing, cross-outcome rebalancing, minimum-return floors and a paired cashout service.",
    litepaperRef: "§1–2 · How a PMM Market Works",
  },
  {
    id: 2,
    category: "The Core Problem",
    question: "Which historic failure of traditional parimutuels does the PMM eliminate?",
    options: [
      "High blockchain gas fees charged on every settlement",
      "Late capital on the winner diluting early payouts",
      "The inability to resolve simple binary outcome markets",
      "Dependence on external price oracles to set entry pricing",
    ],
    answerIndex: 1,
    explanation:
      "In classic parimutuels the pool is split pro-rata, so late capital entering the correct outcome after the result is apparent dilutes earlier correct participants. The PMM is the first parimutuel system to eliminate this rather than work around it.",
    litepaperRef: "Abstract · §1 Introduction",
  },
  {
    id: 3,
    category: "Pricing Engine",
    question: "How do the PMM's mutually-aware outcome price curves work?",
    options: [
      "Each outcome is priced in isolation from only its own liquidity",
      "Odds are fixed once at market creation and then never change",
      "Every curve reads full pool state; each trade reprices all outcomes",
      "Prices are copied from the same event on a rival exchange",
    ],
    answerIndex: 2,
    explanation:
      "Each outcome has its own curve, but every curve reads the full pool state (counterparty liquidity, shares, deposited value, rewards). Capital entering one outcome moves its curve and updates all others in the same step, with total liquidity preserved.",
    litepaperRef: "§2 · Pricing",
  },
  {
    id: 4,
    category: "Floor Guarantee",
    question: "What is a position's minimum-return floor?",
    options: [
      "A guaranteed profit that pays out no matter which outcome wins",
      "A cashout quote redeemable at any moment for the held position's full expected value",
      "A user-set stop-loss level that can later be lowered again",
      "A settlement minimum set at entry that only rises, paid if the position wins",
    ],
    answerIndex: 3,
    explanation:
      "The floor is recorded at entry from pool state + order of entry. Every later trade is priced to preserve all outstanding floors. Accrued rewards can raise a floor but never reduce it — it is intrinsic to pricing, not a guarantee layered on top.",
    litepaperRef: "§2–3 · Entry-Time Price Integrity",
  },
  {
    id: 5,
    category: "Market Interaction",
    question: "Through which three operations do participants interact with a PMM market?",
    options: [
      "Bids, asks and fills resting on a central limit order book",
      "Buy a position, switch outcomes, or cash out via vault",
      "Mint, burn and stake liquidity provider tokens for yield",
      "Long, short and apply leverage using posted collateral",
    ],
    answerIndex: 1,
    explanation:
      "Buy deposits value and issues shares + a floor. Switch moves exposure between outcomes preserving expected value (new floor on the receiving outcome). Cashout exits pre-resolution through the cashout LP vault for instant liquidity.",
    litepaperRef: "§3 · Continuous Trading",
  },
  {
    id: 6,
    category: "Switch vs Cashout",
    question: "What is the key difference between a switch and a cashout?",
    options: [
      "The two operations are identical — both of them leave the pool the same way",
      "Switches keep value inside the PMM; cashouts exit via the vault discounted",
      "A cashout keeps the full expected value while every switch always loses ten percent",
      "A switch requires an external oracle while a cashout needs none at all",
    ],
    answerIndex: 1,
    explanation:
      "A switch preserves the position's expected value (probability × principal + floor + rewards) inside the core pool. A cashout's discount is the cost of on-demand liquidity, not slippage — the cashout LP takes over the position and pays you instantly.",
    litepaperRef: "§3 · Continuous Trading",
  },
  {
    id: 7,
    category: "Cold-Start",
    question: "How does the PMM achieve permissionless cold-start from the first dollar?",
    options: [
      "By waiting for professional market makers to arrive and seed each book",
      "The pool itself is the counterparty, so the first deposit opens trading",
      "By subsidizing every single market with dedicated operator funds",
      "By copying liquid depth directly from Uniswap pools",
    ],
    answerIndex: 1,
    explanation:
      "Unlike a CLOB (empty book = no price), the PMM pool is the counterparty so there is no inventory to seed. Presale deposits clear at a constant price with proportional scale-down, and presalers earn the largest share of counterparty-liquidity rewards.",
    litepaperRef: "§3 · Permissionless Cold-Start",
  },
  {
    id: 8,
    category: "Peer-to-Peer Economics",
    question: "Why do AMMs and LMSR fail the “no subsidy” requirement for expiring event contracts?",
    options: [
      "They cannot handle any markets with more than two outcomes",
      "AMM pools drift into losers; LMSR needs a subsidized operator",
      "They always settle far too slowly at final resolution time",
      "They are always forced to charge zero fees to traders",
    ],
    answerIndex: 1,
    explanation:
      "Event contracts expire: one side goes to zero, so AMM pools end up short the correct outcome as information arrives, and fees come straight out of fixed payouts. The PMM keeps counterparty liquidity inside the participant pool — no neutral LP must absorb informed flow.",
    litepaperRef: "§3 · Peer-to-Peer Economics",
  },
  {
    id: 9,
    category: "Passive Yield",
    question: "How does passive bootstrapping capital earn in the PMM?",
    options: [
      "By actively quoting both sides of the book like a market maker",
      "Early positions earn rewards as opposing flow arrives and lifts floors",
      "Through a fixed staking APY that is paid out by Melee",
      "By arbitraging fee differences across other trading platforms",
    ],
    answerIndex: 1,
    explanation:
      "Early / presale (opinionated) capital pairs directional risk with the largest reward share; non-directional capital earns via the cashout LP vault spread. Little price movement → returns near the floor; more movement → more rewards from absorbing volatility.",
    litepaperRef: "§3 · Profitable Passive Bootstrapping",
  },
  {
    id: 10,
    category: "Simulations",
    question: "What did the 126 simulated 15-minute Bitcoin markets prove?",
    options: [
      "Winners settled above entry floors; presales gained in 65.1% of markets",
      "Floors were broken and breached in half of all markets",
      "Passive presale returns were always guaranteed with zero downside",
      "PMM positions could never beat a static bet placed on another platform",
    ],
    answerIndex: 0,
    explanation:
      "Floor-solvency held in all 126 markets (formally verified). PMM winners beat the equivalent static winning bet in 65.1% of markets (avg +9.6%, median +24.4%, range −48.9% to +67.2%). Presale ranged −22.7% to +28.1% — risk-bearing, not guaranteed.",
    litepaperRef: "§4 · Market Simulations",
  },
  {
    id: 11,
    category: "Origins · DPM",
    question: "The PMM builds on Pennock's dynamic parimutuel (DPM, 2004). What DPM limitation does the PMM overcome?",
    options: [
      "The DPM was unable to price binary markets at all",
      "The DPM still dilutes early conviction across full-duration trading",
      "The DPM required a central limit order book in order to function",
      "The DPM had no concept of outcome shares at all",
    ],
    answerIndex: 1,
    explanation:
      "The DPM added dynamic entry/exit so parimutuels could trade during events, but it still settles pro-rata — late correct capital dilutes early correct participants. The PMM's minimum-return floors fix exactly this.",
    litepaperRef: "§1 Introduction",
  },
  {
    id: 12,
    category: "Presale Mechanics",
    question: "How does an optional PMM presale clear?",
    options: [
      "First-come-first-served entries clearing at continuously rising prices",
      "A Dutch auction that is run by professional market makers",
      "Constant close price, with oversubscription scaled down proportionally",
      "A random lottery allocation shared among all depositors",
    ],
    answerIndex: 2,
    explanation:
      "Presale deposits clear at one constant price fixed at close; too much demand scales everyone down proportionally. In exchange for the earliest position risk, presalers receive the largest share of counterparty-liquidity rewards.",
    litepaperRef: "§3 · Permissionless Cold-Start",
  },
  {
    id: 13,
    category: "Bootstrapping",
    question: "If a market launches with NO presale, how does it start trading?",
    options: [
      "It simply waits until a professional market maker arrives",
      "It bootstraps parimutuel-style, then flips to PMM trading",
      "It opens immediately with full PMM pricing on absolutely zero liquidity",
      "It copies live prices from another prediction platform feed",
    ],
    answerIndex: 1,
    explanation:
      "Without a presale the market starts in a plain parimutuel bootstrapping state and flips into continuous PMM pricing once enough liquidity has accumulated — still no market maker required.",
    litepaperRef: "§3 · Permissionless Cold-Start",
  },
  {
    id: 14,
    category: "Settlement Guarantee",
    question: "What backstops the claim that every floor holds at settlement?",
    options: [
      "Emergency top-ups from the Melee treasury whenever the pools run short",
      "Floors formally verified against settlement logic, plus simulated stress tests",
      "An external insurance fund that covers every possible shortfall",
      "Signed oracle attestations published well before each resolution",
    ],
    answerIndex: 1,
    explanation:
      "The floor is not marketing: floor-solvency is formally verified against the settlement function, and the §4 simulations confirm every qualifying winning position settled at or above its entry floor.",
    litepaperRef: "§3–4 · Settlement & Simulations",
  },
  {
    id: 15,
    category: "Cashout LP Yield",
    question: "How does the cashout LP vault earn its yield?",
    options: [
      "A guaranteed fixed APY that is always paid out by Melee",
      "Exit spreads plus unsold winning shares at resolution",
      "Trading fees that are skimmed from the core pool",
      "Liquidation penalties that are charged to losing positions",
    ],
    answerIndex: 1,
    explanation:
      "Cashout LPs are a separate, clearly-priced service: they earn the exit spread plus whatever their taken-over winning shares are worth at resolution — never a subsidy from the core pool.",
    litepaperRef: "§3 · System at a Glance",
  },
  {
    id: 16,
    category: "Market Creators",
    question: "How are market creators compensated?",
    options: [
      "They take a small cut of platform fees on activity",
      "They take the entire pool share of every single losing outcome",
      "Through MELEE token emissions that are paid out per every market",
      "Market creation is purely altruistic and is never compensated",
    ],
    answerIndex: 0,
    explanation:
      "Creators earn a cut of platform fees on everything their market does. Like every other role, they are paid by the market's own activity rather than external subsidy.",
    litepaperRef: "§3 · System at a Glance",
  },
  {
    id: 17,
    category: "Limitations",
    question: "What is true about exiting a PMM position before resolution?",
    options: [
      "You can always exit the position at full expected value",
      "Cashout exits at a discount, subject to vault depth",
      "Exit is impossible; every position must be held to resolution",
      "Exits are free and instant at exactly the floor value",
    ],
    answerIndex: 1,
    explanation:
      "Instant exit is explicitly not part of the core pool: it depends on the cashout LP, is quoted at a discount, and may be constrained by how deep the vault is.",
    litepaperRef: "§5 · Limitations",
  },
  {
    id: 18,
    category: "Reward Concentration",
    question: "For markets that skip the presale, who gets the counterparty-liquidity rewards?",
    options: [
      "Rewards are split evenly among traders in the market",
      "The earliest entrants keep the whole reward share by design",
      "All rewards are burned permanently to reduce token supply",
      "All leftover rewards default automatically to the cashout provider vaults",
    ],
    answerIndex: 1,
    explanation:
      "With no presale split, rewards concentrate on the earliest entrants per the volume-weighted schedule. The paper flags this as an available design choice for creators; passive returns always depend on growth, volatility, flow and parameters.",
    litepaperRef: "§5 · Limitations",
  },
  {
    id: 19,
    category: "Simulations I",
    question: "Across the 126 simulated BTC markets, how did PMM winners compare to a static winning bet held elsewhere?",
    options: [
      "PMM positions always returned less than static bets",
      "PMM won in 65.1% of markets, averaging +9.6% overall",
      "Returns came out identical in every single market",
      "PMM positions returned more in a full 100% of markets",
    ],
    answerIndex: 1,
    explanation:
      "Held-to-resolution PMM positions accrue counterparty-liquidity rewards as they absorb opposing flow — value a static bet never captures. But in roughly a third of markets the static bet still won.",
    litepaperRef: "§4 · Market Simulations",
  },
  {
    id: 20,
    category: "Simulations II",
    question: "How did a passive presale position (equal stake on both outcomes) perform in simulation?",
    options: [
      "A guaranteed +12.7% return in every single market",
      "Positive in 65.1% of markets, averaging +4.9%; losers can lose",
      "Negative across every single market that was tested",
      "It never once beat the returns of simply holding cash",
    ],
    answerIndex: 1,
    explanation:
      "Returns scale with price movement: quiet markets settle near the floor, volatile ones accrue rewards. The positive average is a risk-bearing strategy outcome — roughly a third of markets lost money.",
    litepaperRef: "§4 · Market Simulations",
  },
  {
    id: 21,
    category: "Mechanism Matrix",
    question: "According to the paper's comparison matrix, which statement is correct?",
    options: [
      "AMMs need no subsidy at all to run expiring markets",
      "The CLOB fully passes the market cold-start requirement today",
      "Only PMM passes all five; AMMs bleed, CLOBs need makers",
      "The classic parimutuel already supports fully continuous trading activity online",
    ],
    answerIndex: 2,
    explanation:
      "Parimutuel: no continuous trading, no price integrity. AMM: LPs structurally bleed. CLOB: empty book means no market without professionals. PMM is the only row with all five checks.",
    litepaperRef: "§3 · Where Each Mechanism Stands",
  },
  {
    id: 22,
    category: "Switch Math",
    question: "What value does a position switch preserve?",
    options: [
      "The exact raw share count held in the position",
      "Expected value — likelihood × principal, floor and rewards",
      "The original entry price that was initially paid",
      "Nothing at all; each new switch resets the entire position",
    ],
    answerIndex: 1,
    explanation:
      "A switch reprices your preserved expected value against current pool state as if it were a fresh entry on the new outcome — which is why switching beats cashing out when only your conviction changed.",
    litepaperRef: "§3 · Continuous Trading",
  },
  {
    id: 23,
    category: "Cashout Pricing",
    question: "How is the cashout quote characterized?",
    options: [
      "A slippage penalty that is charged against the core pool",
      "A discounted exit quote — paying for immediacy, RFQ-ready",
      "Always exactly equal to the position's own floor",
      "A price that is set periodically by governance vote",
    ],
    answerIndex: 1,
    explanation:
      "The discount pays the vault for immediacy; the pool itself is untouched — the LP takes over your position. Because quotes are request-based, the vault generalizes to RFQ liquidity.",
    litepaperRef: "§3 · Continuous Trading",
  },
  {
    id: 24,
    category: "Proprietary Core",
    question: "What does the paper disclose about the PMM's production curve family and parameters?",
    options: [
      "The complete open-source formulas and parameter schedules",
      "Undisclosed and proprietary; only observable behavior is described",
      "That the curves are forked from Uniswap v3",
      "That market creators vote on the curves per market",
    ],
    answerIndex: 1,
    explanation:
      "Melee keeps the curve family, parameter schedule and rebalancing implementation private. The litepaper's claims rest on externally observable behavior — including the verified floor property.",
    litepaperRef: "§1–2 · Scope note",
  },
  {
    id: 25,
    category: "Resolution",
    question: "What happens at resolution?",
    options: [
      "Winners take pool share plus rewards, above their floor",
      "The whole pool rolls over into the next market automatically",
      "Every single participant is refunded an exactly equal share",
      "Cashout liquidity providers unilaterally decide all the payouts",
    ],
    answerIndex: 0,
    explanation:
      "Settlement is peer-to-peer among participants: each realized-outcome position's payout is computed from its share, accrued rewards and settlement-assigned liquidity — and must satisfy its minimum-return floor.",
    litepaperRef: "§3 · Peer-to-Peer Economics",
  },
];
