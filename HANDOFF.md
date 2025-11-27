FIRE PLANNER - DEVELOPMENT HANDOFF
===================================
Last Updated: November 27, 2025

QUICK START FOR NEW AI ASSISTANT
---------------------------------
This is a modular FIRE (Financial Independence, Retire Early) planning web application.
Three modules are complete and working. Seven more need to be built.

**To continue development:**
1. Read this entire file first
2. Then read: index.html (understand the module loading system)
3. Then read: modules/budget.js (see the pattern for building modules)
4. Follow the same pattern for new modules

**Current Status:**
- Budget Builder: ✅ COMPLETE & TESTED
- ACA Subsidy Calculator: ✅ COMPLETE & TESTED  
- Tax Calculator: ✅ COMPLETE & TESTED
- Portfolio: 🔲 Placeholder only
- Years to FI: 🔲 Not started
- Retirement Simulator: 🔲 Not started
- 6 other modules: 🔲 Not started

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
  /shared/
    state-manager.js            ← Handles localStorage, import/export
  /modules/
    budget.js                   ← ✅ COMPLETE
    aca.js                      ← ✅ COMPLETE
    tax.js                      ← ✅ COMPLETE
    portfolio.js                ← 🔲 TODO
    years-to-fi.js              ← 🔲 TODO
    retirement-sim.js           ← 🔲 TODO
    bucket.js                   ← 🔲 TODO
    roth.js                     ← 🔲 TODO
    withdrawal.js               ← 🔲 TODO
    dashboard.js                ← 🔲 TODO
  /data/
    shiller_annual_data.json    ← Historical market data (1871-2024), validated

HOW THE APP WORKS
-----------------
1. User opens index.html in browser (via local web server)
2. Sees card-based dashboard with 10 module cards
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

### 2. ACA SUBSIDY CALCULATOR (modules/aca.js)
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

### 3. TAX CALCULATOR (modules/tax.js)
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

HISTORICAL DATA
---------------
File: /data/shiller_annual_data.json

**Source:** Robert Shiller's stock market dataset
**Coverage:** 1871-2024 (154 complete years)
**Validation:** Tested against FICalc.org with 0.62% accuracy

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

**1. Portfolio Module**
**Purpose:** Track current savings and asset allocation

**Inputs needed:**
- Current portfolio value
- Asset allocation (% stocks, % bonds, % cash)
- Account types with balances (401k, IRA, Roth, Taxable, HSA)
- Current savings rate ($/month or $/year)
- Expected return assumptions (or use historical averages)

**Why important:**
- Feeds Years to FI calculator
- Needed for retirement simulator
- Shows progress toward FI number

**Implementation notes:**
- Could pull FI number from Budget module
- Show "% to FI" progress bar
- Allow multiple accounts with tax treatment flags
- Calculate asset location optimization hints

**2. Years to FI Calculator**
**Purpose:** Simple calculation of time to reach FI

**Formula:**
- FI Number (from Budget): annual expenses × 25
- Current Savings (from Portfolio)
- Annual Savings (from Portfolio)
- Years = (FI Number - Current Savings) / Annual Savings

**Enhancements:**
- Account for investment returns (compound growth)
- Show sensitivity analysis (what if returns vary?)
- Show impact of increasing savings rate
- Graph showing progress over time

**Integration:**
- Pulls from Budget: FI number
- Pulls from Portfolio: current savings, savings rate
- Could pull expected returns from historical data

### MEDIUM PRIORITY

**3. Retirement Simulator**
**Purpose:** Test retirement success with historical data

**Features:**
- Use Shiller historical data for backtesting
- Set retirement year, portfolio size, withdrawal amount
- Run simulation across all historical periods
- Calculate success rate (% of periods that don't run out)
- Show best/worst/median scenarios
- Test different withdrawal strategies:
  - Fixed dollar (inflation-adjusted)
  - Fixed percentage
  - Guardrails (reduce in down markets)
  - Variable (based on portfolio performance)

**Implementation:**
- Load shiller_annual_data.json
- For each starting year (1871-1994 for 30-year retirement):
  - Simulate withdrawals + returns year by year
  - Track if portfolio survives
- Display success rate, sequence of returns risk
- Show distribution of ending balances

**Integration:**
- Portfolio: starting balance, allocation
- Budget: withdrawal amount
- Could test reducing discretionary spending in bad years

**4. Bucket Strategy Builder**
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

**5. Tax Calculator Enhancements**
**Purpose:** More sophisticated tax optimization

**Add:**
- Roth conversion analysis (which we made a separate module)
- Tax-efficient withdrawal sequencing
- RMD calculations
- State taxes (optional, complex)
- Medicare IRMAA brackets

**6. Roth Conversion Optimizer**
**Purpose:** Determine optimal Roth conversion amounts

**Features:**
- Input: Pre-tax IRA balance, current age, retirement age
- Calculate: Optimal annual conversions to fill tax brackets
- Consider: ACA cliff, IRMAA thresholds, future RMDs
- Show: Tax cost now vs future tax savings

### LOW PRIORITY

**7. Withdrawal Strategy Comparison**
**Purpose:** Compare different withdrawal methods

**Strategies to test:**
- 4% rule (fixed)
- Variable percentage
- Guardrails (Guyton-Klinger)
- Required Minimum Distribution (RMD) based
- Ratcheting (can increase but not decrease)

**Output:**
- Success rates for each
- Expected spending variability
- Failure modes
- Best/worst case scenarios

**8. Dashboard**
**Purpose:** Integrated view of entire plan

**Features:**
- Summary cards from all modules
- Current FI progress
- Tax-optimized withdrawal plan
- Healthcare cost estimate
- Visual timeline to FI
- What-if scenarios

**9. Bucket Strategy (detailed)**
Already outlined above

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
- Forms always prevent default

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

### Integration Points
- Budget → Years to FI (FI number)
- Budget → ACA (income estimate)
- Budget → Tax (annual spending)
- Portfolio → Years to FI (current savings, savings rate)
- Tax → ACA (MAGI calculation)
- ACA → Budget (healthcare cost)
- Historical Data → Retirement Simulator
- All modules → Dashboard

### Optional vs Required Integration
- Modules work standalone (user can enter data manually)
- Integration is OPTIONAL but helpful
- Show "Pull from [Module]" buttons where integration helps
- Never require another module to function

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
- Complete Portfolio module
- Complete Years to FI calculator
- Add "Send to Budget" integration for ACA/Tax
- Import functionality (currently only export)

### Phase 2 (Medium-term)
- Retirement simulator with historical data
- Roth conversion optimizer
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

1. **User's location:** State (for state tax if expanding beyond Florida)
2. **Priority:** Which module to build next?
3. **Integration:** Should modules auto-populate from each other?
4. **Complexity:** How sophisticated should retirement simulator be?
5. **Design:** Want to add colors/styling or keep minimal?
6. **Mobile:** Test on actual devices or just browser?
7. **Data:** Keep using historical data or add Monte Carlo simulation?

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
**Git Repository:** Local repository on Frank's machine
**Current Status:** 3 modules complete, 7 to go
**Last Session:** November 27, 2025
**Token Usage:** ~135k tokens

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
