FIRE PLANNER - DEVELOPMENT HANDOFF
===================================
Last Updated: December 10, 2025

QUICK START FOR NEW AI ASSISTANT
---------------------------------
This is a modular FIRE (Financial Independence, Retire Early) planning web application.
Seven modules are complete and working. Four more need to be built.

**To continue development:**
1. Read this entire file first
2. Then read: index.html (understand the module loading system)
3. Then read: modules/budget.js (see the pattern for building modules)
4. Then read: shared/simulation-engine.js (understand historical backtesting)
5. Follow the same pattern for new modules

**Current Status:**
- Budget Builder: ✅ COMPLETE & TESTED
- Portfolio: ✅ COMPLETE & TESTED
- Income: ✅ COMPLETE & TESTED
- Tax Calculator: ✅ COMPLETE & TESTED
- ACA Subsidy Calculator: ✅ COMPLETE & TESTED
- Retirement Simulator: ✅ COMPLETE & TESTED (inflation-adjusted results)
- Years to FI: ✅ COMPLETE & TESTED
- Bucket Strategy: 🔲 Not started
- Roth Conversions: 🔲 Not started (HIGH PRIORITY - see user context)
- Withdrawal Strategy: 🔲 Not started
- Dashboard: 🔲 Not started

PROJECT OVERVIEW
-----------------
**What:** Web-based FIRE planning tool with multiple integrated calculators
**Tech Stack:** Pure HTML/CSS/JavaScript (no framework), localStorage for persistence
**Architecture:** Modular - each calculator is a separate .js file that can work standalone
**Target User:** Early retirees planning healthcare, taxes, withdrawal strategies
**Future:** Will convert to iOS app using Capacitor (mobile-first design)

USER CONTEXT - FRANK'S SITUATION
---------------------------------
Understanding Frank's specific situation helps inform module development priorities:

**Personal Details:**
- Age: ~44 (born ~1981)
- Occupation: Retail pharmacist (spouse also pharmacist)
- Household AGI: ~$356k (split 50/50)
- Current tax bracket: 24%
- Filing status: Married Filing Jointly with 2 kids
- Location: Florida (no state income tax)
- Retirement timeline: 4-6 years
- RMD start age: 75 (31 years away)

**Asset Breakdown (~$4.57M total):**

| Category | Amount | Tax Treatment |
|----------|--------|---------------|
| Cash/Savings | $52,500 | Taxable |
| 401k | $1,295,000 | Traditional (pre-tax) |
| Publix ESOP | $906,739 | Traditional (pre-tax) |
| **Total Pre-Tax** | **$2,201,739** | Taxable on withdrawal |
| Vanguard Roth IRA | $261,400 | Tax-free |
| Schwab Brokerage | $57,000 | Taxable (LTCG) |
| Vanguard Brokerage | $926,000 | Taxable (~40% basis) |
| Publix Stock | $918,000 | Taxable (~30% basis) |
| **Total Taxable Brokerage** | **$1,901,000** | ~34% basis, 66% gains |
| 529 Plans | $151,000 | For kids' education |
| Coinbase | $6,900 | Crypto |

**Key Financial Details:**
- Annual spending: ~$150,000
- Mortgage: $345k balance, 3.5% rate, $1,850/month payment, 24 years remaining
- Annual dividends: ~$52,000 ($40k Publix, $12k other)
- ACA subsidy cliff (family of 4): ~$130k MAGI

**Critical MAGI Calculation Insight:**
When selling stock from brokerage, only the GAINS count toward MAGI, not the full sale:
- Sell $100k stock with 66% gains = $66k MAGI (not $100k)
- Dividends are cash received AND count toward MAGI
- For $150k spending: $50k dividends + $100k stock sale = $150k cash but only $116k MAGI

**Mortgage Payoff Analysis (from user's spreadsheet):**

| Scenario | Keep Mortgage | Pay Off Mortgage |
|----------|---------------|------------------|
| Total Dividends | $52,000 | $44,655 |
| Expenses | $150,000 | $127,800 |
| Stock Sales Needed | $98,000 | $83,145 |
| Gains (66%) | $64,680 | $54,876 |
| **Total MAGI** | **$116,680** | **$99,531** |
| **ACA Yearly Credit** | **$14,688** | **$16,344** |
| Roth Conversion Room | ~$13k | ~$30k |

**RMD Time Bomb:**
- $2.2M pre-tax growing at 5% for 31 years = ~$9-10M
- RMD at 75 on $10M ≈ $400k/year forced withdrawal
- That's 35% bracket territory
- Makes Roth conversions during low-income early retirement years very valuable

HIGH-SPENDER FIRE STRATEGY INSIGHTS
------------------------------------
Frank's $150k+ spending means traditional FIRE advice doesn't apply:

**Standard FIRE ($40-60k spend):**
- Fill 0% LTCG bracket
- Maximize ACA subsidies ($15-20k/year value)
- Roth ladder at 12% bracket
- Healthcare: $200-400/month

**High Spender Reality ($150k spend):**
- Already in 22-24% bracket even in retirement
- ACA subsidies possible but tight (depends on MAGI management)
- Healthcare without subsidies: $1,500-2,500/month
- Need to optimize against RMDs and IRMAA, not just current taxes

**Key Optimization Levers for High Spenders:**
1. **MAGI management** - Sell high-basis lots, minimize realized gains
2. **Roth conversion timing** - Fill brackets during early retirement
3. **RMD reduction** - Convert enough pre-tax to avoid 35%+ bracket at 75
4. **IRMAA awareness** - Medicare surcharges kick in at $206k+ MAGI
5. **Tax bracket arbitrage** - Pay 22-24% now vs 32-35% later

FILE STRUCTURE
--------------
/fire-planner/
  index.html                    ← Landing page, modal system, module loader
  shiller_annual_data11262025.json  ← Historical market data (1871-2024), validated
  /shared/
    state-manager.js            ← Handles localStorage, import/export
    simulation-engine.js        ← ✅ Historical backtesting engine (REAL dollars)
  /modules/
    budget.js                   ← ✅ COMPLETE
    portfolio.js                ← ✅ COMPLETE (with 13 account types)
    income.js                   ← ✅ COMPLETE
    tax.js                      ← ✅ COMPLETE
    aca.js                      ← ✅ COMPLETE
    retirement-sim.js           ← ✅ COMPLETE (inflation-adjusted results)
    years-to-fi.js              ← ✅ COMPLETE (uses simulation engine)
    bucket.js                   ← 🔲 TODO
    roth.js                     ← 🔲 TODO (HIGH PRIORITY)
    withdrawal.js               ← 🔲 TODO
    dashboard.js                ← 🔲 TODO

RECENT SESSION UPDATES (December 10, 2025)
-------------------------------------------

### Retirement Simulator - Inflation Adjustment Fix

**Problem Identified:**
Retirement simulator showed vastly different ending balances vs FICalc.app despite identical success rates. Example: $1M portfolio showed $18.6M max vs FICalc's $7.857M.

**Root Cause:**
- FICalc displays ending balances in REAL (inflation-adjusted, today's) dollars
- Our simulator was displaying NOMINAL (future) dollars
- Both calculations were mathematically correct, just different display conventions

**Solution Implemented:**
Updated `shared/simulation-engine.js` and `modules/retirement-sim.js`:
- Track cumulative inflation throughout each scenario
- Return `finalBalance` in REAL dollars (primary value)
- Also return `finalBalanceNominal` for reference
- All statistics (percentiles, best/worst cases) now use real dollars
- UI clearly labels values as "today's dollars (inflation-adjusted)"
- Added methodology note explaining approach matches FICalc

**Validation:**
1943 start scenario:
- Nominal: $18,639,494
- Real: $7,411,940
- Cumulative inflation: 151.5%
- Matches FICalc within ~6%

### Key Insight: MAGI Calculation for Brokerage Withdrawals

Critical for ACA subsidy optimization:
```
MAGI = Dividends + Capital Gains (NOT full withdrawal amount)

Example:
- Need $150k cash to spend
- Have $50k in dividends (cash + MAGI)
- Need $100k more from stock sales
- Sell $100k with 66% gains = $66k MAGI
- Total: $150k cash, but only $116k MAGI
```

This means high-basis taxable accounts are extremely valuable for MAGI management.

HOW THE APP WORKS
-----------------
1. User opens index.html in browser (via local web server)
2. Sees card-based dashboard with 11 module cards
3. Clicks a card → opens modal with that module
4. Module JavaScript loads dynamically from /modules/
5. User enters data → auto-saves to localStorage
6. User can export data as JSON backup
7. Modules can share data via getData() API

CRITICAL DESIGN PATTERNS
-------------------------

### Pattern 1: Module Structure
Every module follows this exact pattern:

```javascript
// Module Name
(function() {
    // Initialize namespace
    if (!window.modules) {
        window.modules = {};
    }
    
    // Module state
    let moduleData = { /* data fields */ };
    let lastResults = null; // For calculated results
    
    // Module definition
    window.modules['modulename'] = {
        init() {
            // Load saved data
            const savedData = StateManager.load('modulename');
            if (savedData) {
                moduleData = savedData.moduleData || moduleData;
                lastResults = savedData.lastResults || null;
            }
            
            // Render UI
            this.render();
            
            // Display last results if any
            if (lastResults) {
                this.displayResults(lastResults);
            }
        },
        
        render() {
            const container = document.getElementById('modalBody');
            container.innerHTML = `/* HTML here */`;
            // Attach event listeners
        },
        
        save() {
            StateManager.save('modulename', { moduleData, lastResults });
        },
        
        exportData() { /* export logic */ },
        
        clearData() { /* clear logic */ },
        
        // Public API for other modules
        getData() {
            return { moduleData, lastResults };
        }
    };
})();
```

### Pattern 2: Data Persistence
- Use StateManager.save('modulename', data) to persist
- Use StateManager.load('modulename') to retrieve
- Keys are prefixed with 'fire-planner-' automatically
- Always save after any data change
- lastResults persists calculation outputs

### Pattern 3: Module Communication
Modules share data via getData() API:
```javascript
// Budget module provides data
window.modules['budget'].getData()
// Returns: { expenses, annualTotal, essentialTotal, fiNumber }

// Another module uses it
const budgetData = window.modules['budget'].getData();
```

### Pattern 4: Real vs Nominal Dollars
The simulation engine now returns values in REAL (inflation-adjusted) dollars:
- All percentiles and statistics are inflation-adjusted
- `finalBalance` = real dollars (primary, for display)
- `finalBalanceNominal` = nominal dollars (for reference)
- `cumulativeInflation` = inflation factor for the period
- This matches FICalc and industry standards

COMPLETED MODULES - DETAILED
-----------------------------

### 1. BUDGET BUILDER (modules/budget.js)
**Purpose:** Track expenses with timing for accurate FIRE planning

**Features:**
- Add/edit/delete expenses
- Name, amount, frequency (monthly/annual)
- Essential vs discretionary categorization
- Advanced timing (startsIn, lastsFor)
- Pre-populated Healthcare expense
- Sorted by annual amount (largest first)
- Auto-calculated FI number (25x annual expenses)

**Public API:**
```javascript
getData() returns {
  expenses: array,
  annualTotal: number,
  essentialTotal: number,
  discretionaryTotal: number,
  fiNumber: number
}
```

### 2. PORTFOLIO MODULE (modules/portfolio.js)
**Purpose:** Track current savings, asset allocation, and account types

**Features:**
- 13 account types: 529, 403b, Brokerage/Taxable, Crypto, ESOP, Gold, HSA, Other, Roth 401k, Roth IRA, Savings/Checking, Traditional 401k, Traditional IRA
- Asset allocation (stocks/bonds/cash %)
- Annual contributions and employer match
- Progress to FI visualization
- Savings rate calculation

**Public API:**
```javascript
getData() returns {
  accounts: array,
  totalValue: number,
  totalContributions: number,
  totalEmployerMatch: number,
  totalSavings: number,
  allocation: { stocks, bonds, cash, esop, crypto, gold }
}
```

### 3. INCOME MODULE (modules/income.js)
**Purpose:** Track income sources for savings rate and tax calculations

**Features:**
- 9 income types
- Tax treatment (Ordinary, Qualified, Tax-Free, Social Security)
- Inflation adjustment flag
- Advanced timing support

### 4. TAX CALCULATOR (modules/tax.js)
**Purpose:** Estimate federal income tax for FIRE planning

**Features:**
- 2025 tax brackets (One Big Beautiful Bill Act)
- Standard deductions: $15,750 (S), $31,500 (MFJ), $23,625 (HOH)
- LTCG/Qualified dividends stacking calculation
- Child Tax Credit ($2,200 per child in 2025)
- MAGI calculation for ACA integration

### 5. ACA SUBSIDY CALCULATOR (modules/aca.js)
**Purpose:** Calculate ACA marketplace subsidies using real CMS API data

**Features:**
- CMS Marketplace API integration
- ZIP code lookup
- Household member management
- Shows plan ranges by metal level
- Calculates APTC

### 6. RETIREMENT SIMULATOR (modules/retirement-sim.js)
**Purpose:** Test retirement sustainability using historical market data

**Features:**
- Historical backtesting across 125+ periods (1871-2024)
- Success rate calculation
- **All results in REAL (inflation-adjusted) dollars** ← UPDATED
- Percentile analysis (5th, 25th, 50th, 75th, 95th)
- Best/worst case identification
- Integration with Portfolio and Budget modules

**Key Implementation:**
```javascript
// Final balances converted to real dollars
const realFinalBalance = currentBalance / cumulativeInflation;

return {
    finalBalance: realFinalBalance,      // PRIMARY - inflation-adjusted
    finalBalanceNominal: currentBalance, // Reference only
    cumulativeInflation: cumulativeInflation
};
```

### 7. YEARS TO FI MODULE (modules/years-to-fi.js)
**Purpose:** Calculate time to reach FI using historical data

**Features:**
- Auto-populates from other modules
- Custom override support
- Historical simulation using Shiller data
- Uses actual portfolio allocation
- Shows percentile ranges

### 8. SIMULATION ENGINE (shared/simulation-engine.js)
**Purpose:** Reusable historical backtesting engine

**IMPORTANT: All results in REAL (inflation-adjusted) dollars**

**Core Functions:**
- `loadHistoricalData()` - Loads Shiller data
- `runWithdrawalSimulation(params)` - Main entry point
- `calculatePortfolioReturn()` - Weighted returns
- `calculateStatistics()` - Percentiles in real dollars

**Inflation Tracking:**
```javascript
// Track cumulative inflation factor
cumulativeInflation *= (1 + yearsData[year].inflation);

// Convert to real dollars at end
const realFinalBalance = currentBalance / cumulativeInflation;
```

MODULES TO BUILD - PRIORITY ORDER
----------------------------------

### HIGH PRIORITY

**1. Roth Conversion Optimizer (modules/roth.js)**
**Purpose:** Determine optimal Roth conversion amounts during early retirement

Given Frank's situation ($2.2M pre-tax, 31 years to RMDs), this is critical.

**Key Features Needed:**
- Input: Pre-tax balances, current age, retirement age, expected returns
- Calculate: Optimal annual conversions to fill tax brackets
- Consider: ACA cliff ($130k), IRMAA thresholds ($206k+), future RMDs
- Show: Year-by-year conversion plan, tax cost now vs future savings
- Model: "What if I convert $X/year for Y years?"

**Conversion Room Calculation:**
```
MAGI from living expenses (dividends + gains)
+ Roth conversion amount
= Total MAGI

Must stay under:
- $130k for ACA subsidies (family of 4)
- $206k to avoid IRMAA (post-65)
- Top of target bracket (12%: $94k, 22%: $201k, 24%: $383k)
```

**RMD Projection:**
```
Pre-tax balance × (1 + return)^years ÷ RMD factor
Example: $2.2M × 1.05^31 ÷ 24.6 = ~$400k/year forced withdrawal
```

**2. Smart Withdrawal Simulator (modules/withdrawal.js)**
**Purpose:** Optimal withdrawal sequencing to minimize lifetime taxes

**Key Features:**
- Year-by-year simulation from retirement to life expectancy
- Optimize: Which accounts to withdraw from each year
- Track: Roth ladder 5-year rule, RMD requirements
- Respect: ACA cliff, IRMAA thresholds
- Output: Recommended withdrawal sequence, projected taxes

**Withdrawal Priority Heuristics:**
1. Required Minimum Distributions (must take)
2. Fill 0% LTCG bracket with capital gains harvesting
3. Fill low ordinary income brackets with Traditional withdrawals
4. Roth conversions to fill remaining bracket space
5. Roth withdrawals for spending above converted amounts

### MEDIUM PRIORITY

**3. Bucket Strategy Builder (modules/bucket.js)**
**Purpose:** 3-bucket portfolio allocation for sequence risk management

**4. Dashboard (modules/dashboard.js)**
**Purpose:** Integrated view showing all modules together

HISTORICAL DATA
---------------
File: shiller_annual_data11262025.json

**Source:** Robert Shiller's stock market dataset
**Coverage:** 1871-2024 (154 complete years)
**Validation:** Tested against FICalc.org with ~6% accuracy

**Data Format:**
```json
{
  "year": 1980,
  "stock_return": 0.3242,  // NOMINAL S&P 500 total return
  "bond_return": -0.0395,  // NOMINAL 10-year Treasury
  "inflation": 0.1252      // CPI year-over-year
}
```

**Real Return Calculation:**
```javascript
realReturn = (1 + nominalReturn) / (1 + inflation) - 1
```

CODING CONVENTIONS
------------------

### Naming
- Module files: lowercase-with-dashes.js
- Module keys: camelCase in window.modules
- Variables: camelCase
- DOM IDs: camelCase

### HTML Generation
- Use template strings with ${variables}
- Keep inline styles (no separate CSS files)
- Forms: use type="button" with onclick for calculate buttons

### Data Display
- Financial values in REAL dollars unless otherwise noted
- Always label "today's dollars" or "inflation-adjusted" for clarity
- Provide nominal values in parentheses for reference when helpful

### Error Handling
- Use try/catch for localStorage and API operations
- Show user-friendly error messages
- Log details to console

RUNNING THE APP
---------------
Must use local web server:
```bash
cd fire-planner
python -m http.server 8000
# Visit: http://localhost:8000
```

TESTING CHECKLIST
-----------------
When building a new module, test:
✅ Data persistence (add → refresh → still there)
✅ Export/Import functionality
✅ Integration with other modules
✅ Mobile responsive (320px width)
✅ No console errors
✅ Calculations match external tools (verify against FICalc, KFF, IRS)

QUESTIONS FOR NEXT SESSION
---------------------------
1. **Roth module priority:** Should this be next? Frank's RMD situation makes it valuable.
2. **Cost basis tracking:** Should Portfolio module track cost basis per account for better MAGI projections?
3. **Mortgage payoff:** User still deciding - should we build a dedicated analysis tool?
4. **Integration depth:** How tightly should Roth optimizer integrate with ACA calculator?

RESOURCES & REFERENCES
----------------------
- FICalc (validation): https://www.firecalc.com/
- KFF ACA Calculator: https://www.kff.org/interactive/subsidy-calculator/
- IRS RMD Tables: https://www.irs.gov/publications/p590b
- IRMAA Thresholds: https://www.medicare.gov/basics/costs/medicare-costs/irmaa
- Shiller Data: http://www.econ.yale.edu/~shiller/data.htm

---
END OF HANDOFF DOCUMENT
