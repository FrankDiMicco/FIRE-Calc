// Tax Calculator Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }
    
    // Tax module state
    let taxData = {
        filingStatus: 'single',
        dependents: 0,
        ordinaryIncome: 0,
        longTermCapitalGains: 0,
        qualifiedDividends: 0,
        hsaContributions: 0,
        useStandardDeduction: true,
        itemizedDeduction: 0,
        year: 2025
    };
    
    let lastResults = null;
    
    // 2025 Tax Brackets and Rates
    const taxBrackets2025 = {
        single: [
            { limit: 11925, rate: 0.10 },
            { limit: 48475, rate: 0.12 },
            { limit: 103350, rate: 0.22 },
            { limit: 197300, rate: 0.24 },
            { limit: 250525, rate: 0.32 },
            { limit: 626350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ],
        married: [
            { limit: 23850, rate: 0.10 },
            { limit: 96950, rate: 0.12 },
            { limit: 206700, rate: 0.22 },
            { limit: 394600, rate: 0.24 },
            { limit: 501050, rate: 0.32 },
            { limit: 751600, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ],
        hoh: [
            { limit: 17000, rate: 0.10 },
            { limit: 64850, rate: 0.12 },
            { limit: 103350, rate: 0.22 },
            { limit: 197300, rate: 0.24 },
            { limit: 250500, rate: 0.32 },
            { limit: 626350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ]
    };
    
    // 2025 Standard Deductions (One Big Beautiful Bill Act)
    const standardDeductions2025 = {
        single: 15750,
        married: 31500,
        hoh: 23625
    };
    
    // 2025 Long-term capital gains brackets
    const ltcgBrackets2025 = {
        single: [
            { limit: 48350, rate: 0.00 },
            { limit: 533400, rate: 0.15 },
            { limit: Infinity, rate: 0.20 }
        ],
        married: [
            { limit: 96700, rate: 0.00 },
            { limit: 600050, rate: 0.15 },
            { limit: Infinity, rate: 0.20 }
        ],
        hoh: [
            { limit: 64750, rate: 0.00 },
            { limit: 566700, rate: 0.15 },
            { limit: Infinity, rate: 0.20 }
        ]
    };
    
    // Module definition
    window.modules['tax'] = {
        init() {
            // Load saved data
            const savedData = StateManager.load('tax');
            if (savedData) {
                taxData = savedData.taxData || taxData;
                lastResults = savedData.lastResults || null;
            }
            
            // Render the module UI
            this.render();
            
            // If we have last results, display them
            if (lastResults) {
                this.displayResults(lastResults);
            }
        },
        
        render() {
            const container = document.getElementById('modalBody');
            
            container.innerHTML = `
                <div class="tax-module">
                    <div class="section">
                        <h3>Filing Information</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Filing Status:</label>
                            <select id="filingStatus" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="single" ${taxData.filingStatus === 'single' ? 'selected' : ''}>Single</option>
                                <option value="married" ${taxData.filingStatus === 'married' ? 'selected' : ''}>Married Filing Jointly</option>
                                <option value="hoh" ${taxData.filingStatus === 'hoh' ? 'selected' : ''}>Head of Household</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Number of Dependents:</label>
                            <input type="number" id="dependents" value="${taxData.dependents}" min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>Income</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Ordinary Income:</label>
                            <input type="number" id="ordinaryIncome" value="${taxData.ordinaryIncome || ''}" 
                                   placeholder="Wages, IRA withdrawals, interest, etc." min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <small style="color: #666;">W-2 wages, 401k/IRA withdrawals, short-term gains, interest, non-qualified dividends</small>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Long-Term Capital Gains:</label>
                            <input type="number" id="longTermCapitalGains" value="${taxData.longTermCapitalGains || ''}" 
                                   placeholder="0" min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <small style="color: #666;">From selling investments held >1 year</small>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Qualified Dividends:</label>
                            <input type="number" id="qualifiedDividends" value="${taxData.qualifiedDividends || ''}" 
                                   placeholder="0" min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <small style="color: #666;">Taxed same as long-term capital gains (0%, 15%, or 20%)</small>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>Deductions & Adjustments</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">HSA Contributions:</label>
                            <input type="number" id="hsaContributions" value="${taxData.hsaContributions || ''}" 
                                   placeholder="0" min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <small style="color: #666;">Above-the-line deduction (reduces AGI)</small>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 10px;">
                                <input type="checkbox" id="useStandardDeduction" ${taxData.useStandardDeduction ? 'checked' : ''}
                                       onchange="window.modules['tax'].toggleDeduction()"> 
                                Use Standard Deduction
                            </label>
                            
                            <div id="itemizedSection" style="display: ${taxData.useStandardDeduction ? 'none' : 'block'}; 
                                                               margin-top: 10px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
                                <label style="display: block; margin-bottom: 5px;">Itemized Deduction Amount:</label>
                                <input type="number" id="itemizedDeduction" value="${taxData.itemizedDeduction || ''}" 
                                       placeholder="0" min="0"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <small style="color: #666;">Total of mortgage interest, state/local taxes (SALT), charitable contributions, etc.</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section" style="margin-top: 20px;">
                        <button onclick="window.modules['tax'].calculateTax()" 
                                style="background: #333; color: white; border: none; padding: 12px 24px; 
                                       border-radius: 4px; cursor: pointer; font-size: 1.1em;">
                            Calculate Federal Tax
                        </button>
                    </div>
                    
                    <div id="results" style="margin-top: 20px;"></div>
                    
                    <div class="section" style="margin-top: 20px;">
                        <h3>Actions</h3>
                        <button onclick="window.modules['tax'].exportData()"
                                style="background: #666; color: white; border: none; padding: 10px 20px; 
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Export Data
                        </button>
                        <button onclick="window.modules['tax'].clearData()"
                                style="background: #999; color: white; border: none; padding: 10px 20px; 
                                       border-radius: 4px; cursor: pointer;">
                            Clear All
                        </button>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 12px; background: #fff3cd; border-radius: 4px;">
                        <small style="color: #856404;">
                            <strong>Disclaimer:</strong> This is a simplified tax estimator for planning purposes only. 
                            It does not account for all tax situations. Consult a tax professional for accurate tax advice.
                        </small>
                    </div>
                </div>
            `;
        },
        
        toggleDeduction() {
            const useStandard = document.getElementById('useStandardDeduction').checked;
            document.getElementById('itemizedSection').style.display = useStandard ? 'none' : 'block';
        },
        
        calculateTax() {
            // Get form values
            taxData.filingStatus = document.getElementById('filingStatus').value;
            taxData.dependents = parseInt(document.getElementById('dependents').value) || 0;
            taxData.ordinaryIncome = parseFloat(document.getElementById('ordinaryIncome').value) || 0;
            taxData.longTermCapitalGains = parseFloat(document.getElementById('longTermCapitalGains').value) || 0;
            taxData.qualifiedDividends = parseFloat(document.getElementById('qualifiedDividends').value) || 0;
            taxData.hsaContributions = parseFloat(document.getElementById('hsaContributions').value) || 0;
            taxData.useStandardDeduction = document.getElementById('useStandardDeduction').checked;
            taxData.itemizedDeduction = parseFloat(document.getElementById('itemizedDeduction').value) || 0;
            
            // Calculate AGI
            const totalIncome = taxData.ordinaryIncome + taxData.longTermCapitalGains + taxData.qualifiedDividends;
            const agi = totalIncome - taxData.hsaContributions;
            
            // MAGI is typically AGI for ACA purposes (simplified)
            const magi = agi;
            
            // Get deduction
            const deduction = taxData.useStandardDeduction 
                ? standardDeductions2025[taxData.filingStatus]
                : taxData.itemizedDeduction;
            
            // Calculate taxable income for ordinary income
            const ordinaryTaxableIncome = Math.max(0, taxData.ordinaryIncome - taxData.hsaContributions - deduction);
            
            // Calculate ordinary income tax
            const ordinaryTax = this.calculateOrdinaryTax(ordinaryTaxableIncome, taxData.filingStatus);
            
            // Calculate preferential income (LTCG + qualified dividends)
            const preferentialIncome = taxData.longTermCapitalGains + taxData.qualifiedDividends;
            const preferentialTax = this.calculatePreferentialTax(preferentialIncome, ordinaryTaxableIncome, taxData.filingStatus);
            
            // Total federal tax before credits
            const totalTaxBeforeCredits = ordinaryTax + preferentialTax;
            
            // Child Tax Credit (2025: $2,200 per child)
            const childTaxCredit = taxData.dependents * 2200;
            
            // Total federal tax after credits
            const totalTax = Math.max(0, totalTaxBeforeCredits - childTaxCredit);
            
            // Effective tax rate
            const effectiveTaxRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;
            
            // Marginal tax rate (simplified - on ordinary income)
            const marginalRate = this.getMarginalRate(ordinaryTaxableIncome, taxData.filingStatus);
            
            const results = {
                agi,
                magi,
                deduction,
                ordinaryTaxableIncome,
                preferentialIncome,
                totalTaxableIncome: ordinaryTaxableIncome + preferentialIncome,
                ordinaryTax,
                preferentialTax,
                totalTaxBeforeCredits,
                childTaxCredit,
                totalTax,
                effectiveTaxRate,
                marginalRate
            };
            
            lastResults = results;
            this.save();
            this.displayResults(results);
        },
        
        calculateOrdinaryTax(taxableIncome, filingStatus) {
            const brackets = taxBrackets2025[filingStatus];
            let tax = 0;
            let previousLimit = 0;
            
            for (let bracket of brackets) {
                if (taxableIncome <= previousLimit) break;
                
                const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
                tax += taxableInBracket * bracket.rate;
                previousLimit = bracket.limit;
            }
            
            return tax;
        },
        
        calculatePreferentialTax(preferentialIncome, ordinaryTaxableIncome, filingStatus) {
            if (preferentialIncome <= 0) return 0;
            
            const brackets = ltcgBrackets2025[filingStatus];
            let tax = 0;
            let remainingIncome = preferentialIncome;
            
            // LTCG/QD stacks on top of ordinary income
            // Figure out which bracket we start in based on ordinary income
            let currentIncome = ordinaryTaxableIncome;
            
            for (let bracket of brackets) {
                if (remainingIncome <= 0) break;
                
                if (currentIncome < bracket.limit) {
                    // We have room in this bracket
                    const roomInBracket = bracket.limit - currentIncome;
                    const taxableInBracket = Math.min(remainingIncome, roomInBracket);
                    
                    tax += taxableInBracket * bracket.rate;
                    currentIncome += taxableInBracket;
                    remainingIncome -= taxableInBracket;
                }
            }
            
            return tax;
        },
        
        getMarginalRate(taxableIncome, filingStatus) {
            const brackets = taxBrackets2025[filingStatus];
            let previousLimit = 0;
            
            for (let bracket of brackets) {
                if (taxableIncome <= bracket.limit) {
                    return bracket.rate * 100;
                }
                previousLimit = bracket.limit;
            }
            
            return brackets[brackets.length - 1].rate * 100;
        },
        
        displayResults(results) {
            const resultsDiv = document.getElementById('results');
            
            resultsDiv.innerHTML = `
                <div style="background: #e8f5e9; padding: 20px; border-radius: 4px; border: 1px solid #4caf50;">
                    <h3 style="margin-bottom: 15px;">Tax Calculation Results (2025)</h3>
                    
                    <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                        <h4 style="margin-bottom: 10px;">Income Summary</h4>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>Adjusted Gross Income (AGI):</div>
                            <div style="text-align: right; font-weight: 600;">$${results.agi.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>MAGI (for ACA):</div>
                            <div style="text-align: right; font-weight: 600;">$${results.magi.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>Deduction:</div>
                            <div style="text-align: right;">-$${results.deduction.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                            <div><strong>Total Taxable Income:</strong></div>
                            <div style="text-align: right; font-weight: 600;">$${results.totalTaxableIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                        <h4 style="margin-bottom: 10px;">Tax Breakdown</h4>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>Tax on Ordinary Income:</div>
                            <div style="text-align: right;">$${results.ordinaryTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>Tax on LTCG + Qualified Dividends:</div>
                            <div style="text-align: right;">$${results.preferentialTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                            <div><strong>Total Before Credits:</strong></div>
                            <div style="text-align: right; font-weight: 600;">
                                $${results.totalTaxBeforeCredits.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-top: 8px;">
                            <div>Child Tax Credit:</div>
                            <div style="text-align: right; color: #2e7d32;">-$${results.childTaxCredit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; padding-top: 8px; border-top: 2px solid #4caf50;">
                            <div><strong>Total Federal Tax:</strong></div>
                            <div style="text-align: right; font-weight: 600; font-size: 1.2em; color: #2e7d32;">
                                $${results.totalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 4px;">
                        <h4 style="margin-bottom: 10px;">Tax Rates</h4>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>Effective Tax Rate:</div>
                            <div style="text-align: right; font-weight: 600;">${results.effectiveTaxRate.toFixed(2)}%</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
                            <div>Marginal Tax Rate:</div>
                            <div style="text-align: right; font-weight: 600;">${results.marginalRate.toFixed(0)}%</div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        save() {
            StateManager.save('tax', { taxData, lastResults });
        },
        
        exportData() {
            const data = { taxData, lastResults };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tax-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        clearData() {
            if (confirm('Are you sure you want to clear all tax data? This cannot be undone.')) {
                taxData = {
                    filingStatus: 'single',
                    dependents: 0,
                    ordinaryIncome: 0,
                    longTermCapitalGains: 0,
                    qualifiedDividends: 0,
                    hsaContributions: 0,
                    useStandardDeduction: true,
                    itemizedDeduction: 0,
                    year: 2025
                };
                lastResults = null;
                this.save();
                this.render();
            }
        },
        
        // Public API for other modules to access tax data
        getData() {
            return {
                taxData,
                lastResults,
                magi: lastResults ? lastResults.magi : 0
            };
        }
    };
})();
