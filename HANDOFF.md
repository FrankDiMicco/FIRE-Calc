FIRE PLANNER - DEVELOPMENT HANDOFF
===================================
Last Updated: December 7, 2025

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
- Retirement Simulator: ✅ COMPLETE & TESTED
- Years to FI: ✅ COMPLETE & TESTED
- Bucket Strategy: 🔲 Not started
- Roth Conversions: 🔲 Not started
- Withdrawal Strategy: 🔲 Not started
- Dashboard: 🔲 Not started

PROJECT OVERVIEW
-----------------
**What:** Web-based FIRE planning tool with multiple integrated calculators
**Tech Stack:** Pure HTML/CSS/JavaScript (no framework), localStorage for persistence
**Architecture:** Modular - each calculator is a separate .js file that can work standalone
**Target User:** Early retirees planning healthcare, taxes, withdrawal strategies
**Future:** Will convert to iOS app using Capacitor (mobile-first design)

FILE STRUCTURE
--------------
/fire-planner/
  index.html                    ← Landing page, modal system, module loader
  shiller_annual_data11262025.json  ← Historical market data (1871-2024), validated
  /shared/
    state-manager.js            ← Handles localStorage, import/export
    simulation-engine.js        ← ✅ Historical backtesting engine (reusable)
  /modules/
    budget.js                   ← ✅ COMPLETE
    portfolio.js                ← ✅ COMPLETE (with 13 account types)
    income.js                   ← ✅ COMPLETE
    tax.js                      ← ✅ COMPLETE
    aca.js                      ← ✅ COMPLETE
    retirement-sim.js           ← ✅ COMPLETE (uses simulation engine)
    years-to-fi.js              ← ✅ COMPLETE (uses simulation engine)
    bucket.js                   ← 🔲 TODO
    roth.js                     ← 🔲 TODO
    withdrawal.js               ← 🔲 TODO
    dashboard.js                ← 🔲 TODO

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

// Tax module uses it
const budgetData = window.modules['budget'].getData();
```

### Pattern 4: UI Rendering
- All HTML in JavaScript template strings
- Use inline styles (no separate CSS files)
- Mobile-first: min-width 280px, responsive grid
- Buttons use onclick="window.modules['name'].method()"
- Forms prevent default, call module methods

COMPLETED MODULES - DETAILED
-----------------------------

### 1. BUDGET BUILDER (modules/budget.js)
**Purpose:** Track expenses with timing for accurate FIRE planning

**Features:**
- Add/edit/delete expenses
- Name, amount, frequency (monthly/annual)
- Essential vs discretionary categorization
- Advanced timing:
  - "Starts in X years" (for future expenses)
  - "Lasts for Y years" (for temporary expenses)
- Pre-populated Healthcare expense (special flag: isHealthcare)
- Sorted by annual amount (largest first)
- Auto-calculated FI number (25x annual expenses)
- Export to JSON, Clear all

**Data Structure:**
```javascript
expenses: [
  {
    id: timestamp,
    name: string,
    amount: number,
    frequency: 'monthly' | 'annual',
    essential: boolean,
    startsIn: number,  // years from now
    lastsFor: number | null,  // null = permanent
    isHealthcare: boolean  // special flag
  }
]
```

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

**Key Implementation Details:**
- Healthcare expense added automatically on first load
- Edit mode: button changes to "Update Expense", preserves isHealthcare flag
- Advanced options collapsed by default, expand with ▶/▼ toggle
- Timing shown as: "starts in 2 years, lasts 4 years"

### 2. PORTFOLIO MODULE (modules/portfolio.js)
**Purpose:** Track current savings, asset allocation, and account types

**Features:**
- Add/edit/delete investment accounts
- 13 account types: 529, 403b, Brokerage/Taxable, Crypto, ESOP, Gold, HSA, Other, Roth 401k, Roth IRA, Savings/Checking, Traditional 401k, Traditional IRA
- Asset allocation (stocks/bonds/cash %) for investment accounts
- Annual contribution tracking per account
- Employer match tracking for 401k/403b
- Contribution duration (how many years contributing)
- Special handling:
  - Savings/Checking: Always 100% cash (allocation hidden)
  - Crypto, Gold, ESOP: Separate asset classes (allocation hidden)
- Total portfolio value calculation
- Weighted average allocation across all accounts
- Savings rate calculation using formula: (contributions + leftover cash) / (take-home + contributions)
- Progress to FI (integrates with Budget module's FI number)
- Visual progress bar showing % to FI
- Sorted by balance (largest first)
- Export/Clear data

**Data Structure:**
```javascript
accounts: [
  {
    id: timestamp,
    name: string,
    type: string,  // one of 13 account types
    balance: number,
    contribution: number,  // annual contribution
    contributionYears: number | null,  // how long contributing
    employerMatch: number,  // annual employer match
    stocks_pct: number,  // 0-100
    bonds_pct: number,   // 0-100
    cash_pct: number     // 0-100
  }
]
```

**Public API:**
```javascript
getData() returns {
  accounts: array,
  totalValue: number,
  totalContributions: number,
  totalEmployerMatch: number,
  totalSavings: number,
  allocation: {
    stocks: number,    // Weighted average %
    bonds: number,     // Weighted average %
    cash: number,      // Weighted average %
    esop: number,      // % of total portfolio
    crypto: number,    // % of total portfolio
    gold: number       // % of total portfolio
  }
}
```

**Key Implementation Details:**
- Allocation validation: must total 100% for investment accounts
- Real-time allocation total display
- Smart display: only shows non-zero asset classes
- Integration: pulls FI number from Budget to show progress
- Savings rate uses take-home pay formula (contributions added back to denominator)

### 3. INCOME MODULE (modules/income.js)
**Purpose:** Track income sources for savings rate and tax calculations

**Features:**
- Add/edit/delete income sources
- 9 income types: Wages/Salary, Social Security, Pension, Rental, Dividends, Interest, Business, Part-time, Other
- Tax treatment: Ordinary, Qualified (LTCG rates), Tax-Free, Social Security
- Inflation adjustment flag for income that grows with CPI
- Advanced timing (startsIn, lastsFor) for future/temporary income
- Summary by type and tax treatment
- Sorted by annual amount (largest first)
- Export/Clear data

**Data Structure:**
```javascript
incomeSources: [
  {
    id: timestamp,
    name: string,
    type: string,  // wages, social-security, pension, etc.
    amount: number,
    frequency: 'monthly' | 'annual',
    taxTreatment: 'ordinary' | 'qualified' | 'tax-free' | 'social-security',
    inflationAdjusted: boolean,
    startsIn: number,
    lastsFor: number | null
  }
]
```

**Public API:**
```javascript
getData() returns {
  incomeSources: array,
  annualTotal: number,
  monthlyAverage: number,
  byType: object,  // totals by income type
  byTaxTreatment: object  // totals by tax treatment
}
```

### 4. TAX CALCULATOR (modules/tax.js)
**Purpose:** Estimate federal income tax for FIRE planning

**Features:**
- Filing status (Single, Married Filing Jointly, Head of Household)
- Number of dependents
- Ordinary income (wages, IRA withdrawals, interest, short-term gains)
- Long-term capital gains (separate field)
- Qualified dividends (separate field, taxed like LTCG)
- HSA contributions (above-the-line deduction)
- Standard vs Itemized deduction (toggle)
- Calculates MAGI for ACA integration
- Shows tax breakdown (ordinary vs preferential)
- Effective and marginal tax rates
- Child Tax Credit ($2,200 per dependent in 2025)
- Results persist

**Tax Year:** 2025 (One Big Beautiful Bill Act)

**2025 Tax Data:**
- Standard Deductions: $15,750 (S), $31,500 (MFJ), $23,625 (HOH)
- Ordinary brackets: 10%, 12%, 22%, 24%, 32%, 35%, 37%
- LTCG brackets: 0% (up to $96,700 MFJ), 15%, 20%
- Child Tax Credit: $2,200 per child

**Critical Calculation Logic:**
1. Calculate AGI = total income - HSA contributions
2. MAGI = AGI (simplified, good enough for ACA)
3. Apply standard or itemized deduction
4. Calculate ordinary income tax using progressive brackets
5. Calculate LTCG/QD tax (stacks on TOP of ordinary income)
6. Apply Child Tax Credit
7. Total = ordinary + preferential - credits

**LTCG Stacking Example:**
- Ordinary income after deduction: $18,500
- LTCG: $100,000
- 0% LTCG bracket top (MFJ): $96,700
- Ordinary uses $18,500 of 0% space
- Remaining 0% space: $96,700 - $18,500 = $78,200
- So: $78,200 @ 0%, $21,800 @ 15%
- LTCG tax: $21,800 × 0.15 = $3,270

**Public API:**
```javascript
getData() returns {
  taxData: object,
  lastResults: object,
  magi: number  // for ACA module
}
```

### 5. ACA SUBSIDY CALCULATOR (modules/aca.js)
**Purpose:** Calculate ACA marketplace subsidies using real CMS API data

**Features:**
- CMS Marketplace API integration (user provides key)
- ZIP code lookup → gets county/state automatically
- Household member management (age, tobacco use)
- MAGI input for subsidy calculation
- Shows plan ranges by metal level (Catastrophic, Bronze, Silver, Gold, Platinum)
- Before and after subsidy pricing
- Calculates actual APTC (Advanced Premium Tax Credit)
- Results persist on reload
- Export/Clear data

**API Integration:**
- Endpoint 1: /api/v1/counties/by/zip/{zip} - gets location
- Endpoint 2: /api/v1/households/eligibility/estimates - gets APTC
- Endpoint 3: /api/v1/plans/search - gets plan pricing
- Fetches 10 plans per metal level (50 total)
- API key stored in localStorage (not exported for security)

**Data Structure:**
```javascript
householdData: {
  zipcode: string,
  state: string,
  county: string (FIPS code),
  year: number,
  income: number (MAGI),
  members: [
    { age: number, uses_tobacco: boolean, dob: string }
  ]
}
lastResults: {
  plans: array,
  aptc_amount: number
}
```

**Critical Details:**
- Uses 2024 as default year (2025 data incomplete)
- APTC is per household, not per person (use first estimate only)
- Plans grouped by metal level, shows min/max premiums
- Color-coded by metal (Bronze=#cd7f32, Silver=#c0c0c0, etc.)
- Calculates average Silver cost for Budget integration

**Known Issues:**
- API returns max 10 plans per metal level despite requesting 20
- aptc_eligible_premium often returns 0 (use eligibility endpoint instead)

### 6. RETIREMENT SIMULATOR (modules/retirement-sim.js)
**Purpose:** Test retirement sustainability using historical market data (1871-2024)

**Features:**
- Historical backtesting across 125+ periods
- Tests withdrawal strategies with actual market returns
- Success rate calculation (% of historical periods that survived)
- Percentile analysis (5th, 25th, 50th, 75th, 95th final balances)
- Best/worst case scenario identification
- Integration with Portfolio (pulls balance + allocation)
- Integration with Budget (pulls annual expenses)
- Visual results with color-coded success rates
- Withdrawal rate comparison vs 4% rule
- Export/Clear data

**Uses Simulation Engine:**
This module relies on `shared/simulation-engine.js` which provides the core backtesting algorithm. The engine is reusable and will support future modules (Years to FI, Bucket Strategy, etc.)

**Algorithm (simplified):**
```
For each historical 30-year period (1871-1901, 1872-1902, etc.):
  Start with portfolio balance
  Each year:
    1. Withdraw annual amount
    2. Check if portfolio depleted (failure)
    3. Apply historical returns (weighted by allocation)
    4. Inflate withdrawal for next year

Calculate statistics:
  - Success rate: % of periods that didn't fail
  - Percentiles of final balances
  - Best case: Highest ending balance (usually 1982 start)
  - Worst case: Earliest failure (usually 1966 start)
```

**Data Structure:**
```javascript
inputs: {
  startingBalance: number,
  annualWithdrawal: number,
  duration: number,  // years
  allocation: {
    stocks: number,  // 0-100
    bonds: number,   // 0-100
    cash: number     // 0-100
  }
}

lastResults: {
  totalScenarios: number,
  successRate: number,  // 0-1
  statistics: {
    finalBalance: {
      percentile5: number,
      percentile25: number,
      percentile50: number,
      percentile75: number,
      percentile95: number
    },
    bestCase: { startYearActual, finalBalance },
    worstCase: { startYearActual, failureYear or finalBalance }
  },
  scenarios: [ /* all individual results */ ]
}
```

**Public API:**
```javascript
getData() returns {
  inputs: object,
  lastResults: object
}
```

**Key Implementation Details:**
- Auto-loads historical data on page load
- Runs ~125 scenarios in 1-3 seconds
- Validates allocation totals 100%
- Visual feedback for Portfolio/Budget pulls
- Color-coded success rates: green (≥95%), yellow (≥85%), red (<85%)

### 7. YEARS TO FI MODULE (modules/years-to-fi.js)
**Purpose:** Calculate time to reach Financial Independence using historical market data

**Features:**
- Auto-populates from other modules (Budget, Portfolio, Income)
- Custom override support with visual indicators (yellow background, "custom" label)
- Reset to calculated values option
- Two calculation modes: Historical Analysis or Custom Return Rate
- Historical simulation uses actual Shiller data (1871-2024)
- Uses actual portfolio allocation from Portfolio module
- Shows percentile ranges (10th, 50th, 90th)
- Progress bar showing current % to FI

**Data Structure:**
```javascript
inputs: {
    fiNumber: number,
    fiNumberCustom: boolean,
    currentPortfolio: number,
    currentPortfolioCustom: boolean,
    annualSavings: number,
    annualSavingsCustom: boolean,
    calculationMode: 'historical' | 'custom',
    expectedReturn: number  // only used in custom mode
}

lastResults: {
    yearsSimple: number | null,
    historicalResults: {
        scenarios: array,
        totalScenarios: number,
        percentile10: number,
        percentile50: number,
        percentile90: number,
        min: number,
        max: number,
        allocation: object
    },
    currentProgress: string,
    mode: string
}
```

**Auto-populate sources:**
- FI Number: Budget module (25x annual expenses)
- Current Portfolio: Portfolio module (total account balances)
- Annual Savings: Portfolio contributions + (Income - Budget expenses)

**Public API:**
```javascript
getData() returns {
    inputs: object,
    lastResults: object
}
```

**Key Implementation Details:**
- Reads directly from localStorage if modules not loaded yet
- Custom flag prevents auto-populate from overwriting user edits
- Historical sim uses actual portfolio allocation (stocks/bonds/cash)
- Alternative assets (Crypto, Gold, ESOP) treated as stocks in simulation

### 8. SIMULATION ENGINE (shared/simulation-engine.js)
**Purpose:** Reusable historical backtesting engine for FIRE calculations

**Core Functions:**
- `loadHistoricalData()` - Loads Shiller data, auto-runs on page load
- `runWithdrawalSimulation(params)` - Main entry point for retirement testing
- `simulateSingleWithdrawal()` - Year-by-year simulation logic
- `calculatePortfolioReturn()` - Weighted returns based on allocation
- `calculateStatistics()` - Percentiles, best/worst cases
- `validateParams()` - Input validation
- `isDataLoaded()` - Check if historical data is loaded
- `getHistoricalData()` - Get raw historical data array

**Usage Example:**
```javascript
const results = SimulationEngine.runWithdrawalSimulation({
  startingBalance: 1000000,
  annualWithdrawal: 40000,
  duration: 30,
  allocation: { stocks: 60, bonds: 40, cash: 0 }
});

console.log('Success Rate:', results.successRate);
// Expected: ~0.95 (95% for 4% rule)
```

**Validation:**
- Tested against FICalc.org for accuracy
- 4% withdrawal from $1M portfolio = ~95% success rate
- Worst historical period: 1966 start (often fails year 28-29)
- Best historical period: 1982 start (portfolio grows significantly)

**Future Uses:**
- Years to FI calculator (accumulation phase) ✅ IMPLEMENTED
- Bucket strategy testing
- Withdrawal strategy comparison
- Roth conversion timing

HISTORICAL DATA
---------------
File: shiller_annual_data11262025.json (root directory)

**Source:** Robert Shiller's stock market dataset
**Coverage:** 1871-2024 (154 complete years)
**Validation:** Tested against FICalc.org with 0.62% accuracy
**Used By:** Simulation Engine (shared/simulation-engine.js)

**Data Format:**
```json
{
  "year": 1980,
  "stock_return": 0.3242,  // S&P 500 total return (nominal)
  "bond_return": -0.0395,  // 10-year Treasury (nominal)
  "inflation": 0.1252      // CPI year-over-year
}
```

**Notes:**
- All returns are nominal (not inflation-adjusted)
- Monthly data aggregated to annual using compound formula
- Only complete years included (12 months of data)
- Perfect for retirement simulations, Monte Carlo analysis
- Can calculate real returns: (1 + nominal) / (1 + inflation) - 1

MODULES TO BUILD - PRIORITY ORDER
----------------------------------

### HIGH PRIORITY

**1. Withdrawal Strategy / Smart Withdrawal Simulator**
**Purpose:** Determine optimal withdrawal sequencing to minimize taxes and ACA premiums

**The Core Problem:**
- Which accounts to withdraw from first? (Taxable, Traditional, Roth)
- When to do Roth conversions?
- How to stay under ACA subsidy cliffs?
- How to manage RMDs?

**Approach:**
- Year-by-year simulation from retirement to life expectancy
- Each year, optimize withdrawal mix to minimize taxes while meeting spending needs
- Track Roth ladder (5-year rule)
- Track RMD requirements after age 73
- Stay under ACA income thresholds when possible

**Key Heuristics:**
- Fill 0% LTCG bracket with capital gains harvesting
- Fill low ordinary income brackets with Roth conversions
- Withdraw from taxable first (generally), but consider tax bracket arbitrage
- Consider ACA cliff (400% FPL) and IRMAA thresholds

**Output:**
- Year-by-year withdrawal plan
- Recommended Roth conversion amounts
- Projected ACA premiums
- Warnings for problem years (RMDs pushing over cliffs, etc.)

### MEDIUM PRIORITY

**2. Bucket Strategy Builder**
**Purpose:** Create 3-bucket portfolio allocation

**Buckets:**
- Bucket 1 (Years 1-5): Cash/bonds for stability
- Bucket 2 (Years 6-15): Balanced for moderate growth
- Bucket 3 (Years 16+): Stocks for long-term growth

**Features:**
- Calculate optimal bucket sizes
- Show refilling strategy
- Test against historical data
- Compare to simple allocation

**3. Roth Conversion Optimizer**
**Purpose:** Determine optimal Roth conversion amounts

**Features:**
- Input: Pre-tax IRA balance, current age, retirement age
- Calculate: Optimal annual conversions to fill tax brackets
- Consider: ACA cliff, IRMAA thresholds, future RMDs
- Show: Tax cost now vs future tax savings

### LOW PRIORITY

**4. Dashboard**
**Purpose:** Integrated view of entire plan

**Features:**
- Summary cards from all modules
- Current FI progress
- Tax-optimized withdrawal plan
- Healthcare cost estimate
- Visual timeline to FI
- What-if scenarios

SAVINGS RATE CALCULATION
-------------------------
The app uses take-home pay (not gross income) for savings rate calculations.

**Formula:**
```
Savings Rate = (contributions + leftover cash) / (take-home + contributions)
```

**Where:**
- contributions = 401k, IRA, HSA contributions from Portfolio module
- leftover cash = Income.annualTotal - Budget.annualTotal (if positive)
- take-home = Income.annualTotal (what hits your bank account)

**Why this formula:**
- Take-home already has 401k contributions removed
- Adding contributions back to denominator gives accurate gross income proxy
- Employer match and ESOP don't count (you didn't choose to save that)

**Example:**
- Take-home: $80,000/year
- 401k contribution: $23,000/year
- Budget expenses: $50,000/year
- Leftover cash: $80k - $50k = $30k
- Total saved: $23k + $30k = $53k
- Gross income proxy: $80k + $23k = $103k
- Savings rate: $53k / $103k = 51%

CODING CONVENTIONS
------------------

### Naming
- Module files: lowercase-with-dashes.js (e.g., years-to-fi.js)
- Module keys: camelCase (e.g., 'yearsToFi')
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- DOM IDs: camelCase

### Functions
- Always use arrow functions for callbacks
- Use function declarations for public methods
- Use descriptive names (calculateTax not calc)

### HTML Generation
- Use template strings with ${variables}
- Keep inline styles for simplicity (no CSS files)
- Always use semantic HTML (form, label, button)
- Inputs always have labels
- Forms: use type="button" with onclick for calculate buttons (avoids validation issues with hidden required fields)

### Data Persistence
- Save after EVERY data change
- Use descriptive keys: StateManager.save('modulename', data)
- Always check if data exists on load
- Provide export/import for backup
- Never store API keys in exports

### Error Handling
- Use try/catch for localStorage operations
- Use try/catch for API calls
- Show user-friendly error messages
- Log details to console for debugging
- Never let app crash silently

### Comments
- Comment WHY not WHAT
- Explain complex calculations
- Note any unusual patterns
- Reference sources for formulas (e.g., "IRS Publication 590")

INTEGRATION STRATEGY
--------------------

### How Modules Share Data
Each module exposes a getData() method:

```javascript
// Budget module
getData() {
  return {
    expenses: expenses,
    annualTotal: 50000,
    essentialTotal: 30000,
    fiNumber: 1250000
  };
}

// Another module uses it
const budget = window.modules['budget'].getData();
console.log(`FI Number: ${budget.fiNumber}`);
```

### Reading Data When Modules Not Loaded
Since modules load dynamically, sometimes you need to read directly from localStorage:

```javascript
// Try loaded module first
let budgetData = window.modules?.budget?.getData();

// If not loaded, read from localStorage
if (!budgetData) {
    const savedData = StateManager.load('budget');
    if (savedData && savedData.expenses) {
        // Calculate what you need from raw data
        const annualTotal = savedData.expenses.reduce((sum, e) => {
            const annual = e.frequency === 'monthly' ? e.amount * 12 : e.amount;
            return sum + annual;
        }, 0);
        budgetData = { annualTotal, fiNumber: annualTotal * 25 };
    }
}
```

### Integration Points
- Budget → Years to FI (FI number)
- Budget → ACA (income estimate)
- Budget → Tax (annual spending)
- Portfolio → Years to FI (current savings, savings rate, allocation)
- Portfolio → Retirement Simulator (balance, allocation)
- Income → Portfolio (for savings rate calculation)
- Income → Years to FI (for annual savings calculation)
- Tax → ACA (MAGI calculation)
- ACA → Budget (healthcare cost)
- Historical Data → Retirement Simulator
- Historical Data → Years to FI
- All modules → Dashboard

### Optional vs Required Integration
- Modules work standalone (user can enter data manually)
- Integration is OPTIONAL but helpful
- Show "Pull from [Module]" buttons where integration helps
- Never require another module to function
- Auto-populate when possible, allow custom override

TESTING CHECKLIST
-----------------
When building a new module, test:

✅ Add data → auto-saves → refresh → data persists
✅ Export data → JSON downloads
✅ Clear data → confirms → data removed → refresh → stays cleared
✅ Enter invalid data → handled gracefully
✅ Calculations are accurate (use external calculators to verify)
✅ Mobile responsive (test at 320px width)
✅ Works in Chrome, Firefox, Safari
✅ No console errors
✅ Integration with other modules works
✅ Auto-populate from other modules works
✅ Custom override preserves user edits

KNOWN ISSUES & LIMITATIONS
---------------------------

### Current Limitations
1. **No state income tax** - Only federal (user is in Florida)
2. **No cost basis tracking** - Too complex for initial version
3. **Simplified MAGI** - Doesn't account for all adjustments
4. **No Social Security** - Could be added later
5. **No pensions** - Could be added later
6. **localStorage only** - No cloud sync (yet)
7. **No authentication** - All data local to browser
8. **API keys in localStorage** - Not ideal but acceptable for MVP

### Browser Compatibility
- Requires modern browser (ES6+ support)
- Must use local web server (not file://)
- localStorage must be enabled
- ~5-10MB storage needed

### Performance
- All calculations done client-side
- Fast even with large datasets
- Shiller data (154 years) loads instantly
- No backend needed

RUNNING THE APP
---------------

### Development
Must use local web server. Options:

**Python:**
```bash
cd fire-planner
python -m http.server 8000
# Visit: http://localhost:8000
```

**VS Code:**
- Install "Live Server" extension
- Right-click index.html → "Open with Live Server"

**Node:**
```bash
npx http-server
```

### Why Web Server?
Browsers block loading local JavaScript files via file:// protocol for security.
Must use http:// or https:// to load modules dynamically.

FUTURE ENHANCEMENTS
-------------------

### Phase 1 (Near-term)
- Smart Withdrawal Simulator (the "holy grail")
- Roth Conversion Optimizer
- Dashboard with integrated view

### Phase 2 (Medium-term)
- Bucket Strategy Builder
- Better error handling and validation
- Undo/redo functionality
- Multiple scenarios comparison

### Phase 3 (Long-term)
- iOS app via Capacitor
- Cloud sync with user accounts
- Social Security integration
- Pension planning
- Import from financial institutions (Plaid API)
- PDF report generation
- Sharing plans via URL

### Technical Debt
- Refactor common UI components (modals, forms)
- Create shared utility functions
- Add unit tests
- Better TypeScript definitions
- Accessibility improvements (ARIA labels, keyboard nav)

RESOURCES & REFERENCES
----------------------

### Tax Information
- IRS Publication 505 (2025): https://www.irs.gov/publications/p505
- Tax Foundation 2025 Brackets: https://taxfoundation.org/data/all/federal/2025-tax-brackets/
- One Big Beautiful Bill provisions: https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions

### ACA Information
- CMS Marketplace API: https://developer.cms.gov/marketplace-api/
- KFF Subsidy Calculator: https://www.kff.org/interactive/subsidy-calculator/
- Healthcare.gov: https://www.healthcare.gov/

### FIRE Resources
- FICalc (for validation): https://www.firecalc.com/
- Shiller Data: http://www.econ.yale.edu/~shiller/data.htm
- ERN Safe Withdrawal Rate Series: https://earlyretirementnow.com/safe-withdrawal-rate-series/

### Development Tools
- MDN Web Docs: https://developer.mozilla.org/
- Can I Use: https://caniuse.com/
- Capacitor (future iOS): https://capacitorjs.com/

QUESTIONS FOR USER
------------------
When continuing development, ask the user:

1. **Priority:** Which module to build next? (Withdrawal Strategy is the "holy grail")
2. **Complexity:** How sophisticated should withdrawal optimizer be?
3. **Design:** Want to add colors/styling or keep minimal?
4. **Mobile:** Test on actual devices or just browser?

EMERGENCY RECOVERY
------------------
If something breaks:

1. **Check browser console:** F12 → Console tab
2. **Check localStorage:** Application → Local Storage → inspect keys
3. **Clear localStorage:** `localStorage.clear()` in console
4. **Revert to last working version:** Use git to rollback
5. **Module not loading:** Check file path, check for syntax errors
6. **Calculations wrong:** Add console.log() to trace through logic
7. **Data not persisting:** Check StateManager.save() is called

CONTACT & HANDOFF
-----------------
**Project Owner:** Frank (FireOutpost.com)
**Git Repository:** GitHub
**Current Status:** 7 modules complete, 4 to go
**Last Session:** December 7, 2025

**To pick up development:**
1. Read this entire HANDOFF.md
2. Read index.html to understand module loader
3. Read modules/budget.js to see the pattern
4. Ask user which module to build next
5. Follow the pattern, test thoroughly
6. Update this file when complete

FINAL NOTES
-----------
This is a passion project for Frank who runs FireOutpost.com (FIRE blog).
He's a retail pharmacist planning early retirement in 4-6 years.
The app should be:
- Simple and clean (minimal design)
- Accurate (validate calculations)
- Practical (solve real FIRE planning problems)
- Mobile-ready (eventual iOS app)

The architecture is solid. The pattern is proven. Just follow it and you'll do great.

Good luck! 🚀

---
END OF HANDOFF DOCUMENT
