// Years to FI Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }

    // Module state
    let inputs = {
        fiNumber: 0,
        fiNumberCustom: false,
        currentPortfolio: 0,
        currentPortfolioCustom: false,
        annualSavings: 0,
        annualSavingsCustom: false,
        expectedReturn: 7.0
    };
    let lastResults = null;

    // Module definition
    window.modules['years-to-fi'] = {
        init() {
            console.log('Years to FI module initializing...');

            // Load saved data
            const savedData = StateManager.load('years-to-fi');
            if (savedData && savedData.inputs) {
                inputs = { ...inputs, ...savedData.inputs };
                lastResults = savedData.lastResults || null;
            }

            // Check which modules are available
            console.log('Checking module availability:');
            console.log('  Budget module:', window.modules?.budget ? '✓ loaded' : '✗ not loaded');
            console.log('  Portfolio module:', window.modules?.portfolio ? '✓ loaded' : '✗ not loaded');
            console.log('  Income module:', window.modules?.income ? '✓ loaded' : '✗ not loaded');

            // Auto-populate non-custom fields from source modules
            this.autoPopulateFields();

            // Render the module UI
            this.render();

            // Display last results if any
            if (lastResults) {
                this.displayResults(lastResults);
            }
        },

        getDataStatusHtml() {
            // Check which modules have data - check localStorage directly
            const savedBudget = StateManager.load('budget');
            const savedPortfolio = StateManager.load('portfolio');
            const savedIncome = StateManager.load('income');

            const budgetOk = savedBudget && savedBudget.expenses && savedBudget.expenses.length > 0;
            const portfolioOk = savedPortfolio && savedPortfolio.accounts && savedPortfolio.accounts.length > 0;
            const incomeOk = savedIncome && savedIncome.incomeSources && savedIncome.incomeSources.length > 0;

            const allOk = budgetOk && portfolioOk && incomeOk;

            if (allOk) {
                return `
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
                        <strong style="color: #2e7d32;">✓ All required data available</strong>
                        <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                            Budget, Portfolio, and Income modules have data
                        </div>
                    </div>
                `;
            } else {
                const missing = [];
                if (!budgetOk) missing.push('Budget (add expenses)');
                if (!portfolioOk) missing.push('Portfolio (add accounts)');
                if (!incomeOk) missing.push('Income (add income sources)');

                return `
                    <div style="background: #fff3e0; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
                        <strong style="color: #e65100;">⚠ Missing data from other modules</strong>
                        <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                            Please set up: ${missing.join(', ')}
                        </div>
                        <div style="color: #666; font-size: 0.85em; margin-top: 5px;">
                            Click on the module cards from the main menu first, then return here and click "Refresh Data"
                        </div>
                    </div>
                `;
            }
        },

        autoPopulateFields() {
            // FI Number from Budget - read directly from localStorage
            if (!inputs.fiNumberCustom) {
                try {
                    // Try loaded module first
                    let budgetData = window.modules?.budget?.getData();

                    // If module not loaded, read directly from localStorage
                    if (!budgetData) {
                        const savedBudgetData = StateManager.load('budget');
                        if (savedBudgetData && savedBudgetData.expenses) {
                            // Calculate annual total from expenses array
                            const annualTotal = savedBudgetData.expenses.reduce((sum, expense) => {
                                const annual = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
                                return sum + annual;
                            }, 0);
                            const withdrawalRate = savedBudgetData.withdrawalRate || 4;
                            budgetData = {
                                fiNumber: (annualTotal / withdrawalRate) * 100,
                                annualTotal: annualTotal
                            };
                        }
                    }

                    if (budgetData && budgetData.fiNumber > 0) {
                        inputs.fiNumber = budgetData.fiNumber;
                        console.log('✓ Auto-populated FI Number from Budget:', inputs.fiNumber);
                    }
                } catch (e) {
                    console.log('Could not pull FI number from Budget module');
                }
            }

            // Current Portfolio from Portfolio - read directly from localStorage
            if (!inputs.currentPortfolioCustom) {
                try {
                    // Try loaded module first
                    let portfolioData = window.modules?.portfolio?.getData();

                    // If module not loaded, read directly from localStorage
                    if (!portfolioData) {
                        const savedPortfolioData = StateManager.load('portfolio');
                        if (savedPortfolioData && savedPortfolioData.accounts) {
                            const accounts = savedPortfolioData.accounts;
                            const totalValue = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
                            const totalContributions = accounts.reduce((sum, account) => sum + (account.contribution || 0), 0);
                            const totalEmployerMatch = accounts.reduce((sum, account) => sum + (account.employerMatch || 0), 0);
                            portfolioData = {
                                totalValue: totalValue,
                                totalContributions: totalContributions,
                                totalEmployerMatch: totalEmployerMatch,
                                totalSavings: totalContributions + totalEmployerMatch
                            };
                        }
                    }

                    if (portfolioData && portfolioData.totalValue >= 0) {
                        inputs.currentPortfolio = portfolioData.totalValue;
                        console.log('✓ Auto-populated Portfolio Value:', inputs.currentPortfolio);
                    }
                } catch (e) {
                    console.log('Could not pull portfolio value from Portfolio module');
                }
            }

            // Annual Savings = contributions + leftover cash - read directly from localStorage
            if (!inputs.annualSavingsCustom) {
                try {
                    // Try loaded modules first
                    let portfolioData = window.modules?.portfolio?.getData();
                    let incomeData = window.modules?.income?.getData();
                    let budgetData = window.modules?.budget?.getData();

                    // If modules not loaded, read directly from localStorage
                    if (!portfolioData) {
                        const savedPortfolioData = StateManager.load('portfolio');
                        if (savedPortfolioData && savedPortfolioData.accounts) {
                            const accounts = savedPortfolioData.accounts;
                            const totalContributions = accounts.reduce((sum, account) => sum + (account.contribution || 0), 0);
                            const totalEmployerMatch = accounts.reduce((sum, account) => sum + (account.employerMatch || 0), 0);
                            portfolioData = {
                                totalContributions: totalContributions,
                                totalEmployerMatch: totalEmployerMatch,
                                totalSavings: totalContributions + totalEmployerMatch
                            };
                        }
                    }

                    if (!incomeData) {
                        const savedIncomeData = StateManager.load('income');
                        if (savedIncomeData && savedIncomeData.incomeSources) {
                            const annualTotal = savedIncomeData.incomeSources.reduce((sum, income) => {
                                const annual = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
                                return sum + annual;
                            }, 0);
                            incomeData = { annualTotal: annualTotal };
                        }
                    }

                    if (!budgetData) {
                        const savedBudgetData = StateManager.load('budget');
                        if (savedBudgetData && savedBudgetData.expenses) {
                            // Calculate annual total from expenses array
                            const annualTotal = savedBudgetData.expenses.reduce((sum, expense) => {
                                const annual = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
                                return sum + annual;
                            }, 0);
                            budgetData = { annualTotal: annualTotal };
                        }
                    }

                    if (portfolioData && incomeData && budgetData) {
                        const contributions = portfolioData.totalContributions || 0;
                        const leftoverCash = incomeData.annualTotal - budgetData.annualTotal;
                        inputs.annualSavings = contributions + Math.max(0, leftoverCash);
                        console.log('✓ Auto-populated Annual Savings:', inputs.annualSavings);
                    }
                } catch (e) {
                    console.log('Could not calculate annual savings from modules');
                }
            }
        },

        render() {
            const container = document.getElementById('modalBody');

            // Determine styling for each field
            const fiNumberStyle = inputs.fiNumberCustom ? 'background: #fffde7;' : '';
            const fiNumberLabel = inputs.fiNumberCustom ? ' <span style="color: #f57c00; font-size: 0.85em;">(custom)</span>' : '';
            const fiNumberReset = inputs.fiNumberCustom ?
                `<a href="#" onclick="window.modules['years-to-fi'].resetField('fiNumber'); return false;"
                    style="color: #666; font-size: 0.85em; text-decoration: none; margin-left: 10px;">↺ Reset to calculated</a>` : '';

            const portfolioStyle = inputs.currentPortfolioCustom ? 'background: #fffde7;' : '';
            const portfolioLabel = inputs.currentPortfolioCustom ? ' <span style="color: #f57c00; font-size: 0.85em;">(custom)</span>' : '';
            const portfolioReset = inputs.currentPortfolioCustom ?
                `<a href="#" onclick="window.modules['years-to-fi'].resetField('currentPortfolio'); return false;"
                    style="color: #666; font-size: 0.85em; text-decoration: none; margin-left: 10px;">↺ Reset to calculated</a>` : '';

            const savingsStyle = inputs.annualSavingsCustom ? 'background: #fffde7;' : '';
            const savingsLabel = inputs.annualSavingsCustom ? ' <span style="color: #f57c00; font-size: 0.85em;">(custom)</span>' : '';
            const savingsReset = inputs.annualSavingsCustom ?
                `<a href="#" onclick="window.modules['years-to-fi'].resetField('annualSavings'); return false;"
                    style="color: #666; font-size: 0.85em; text-decoration: none; margin-left: 10px;">↺ Reset to calculated</a>` : '';

            container.innerHTML = `
                <div class="years-to-fi-module">
                    <div class="section">
                        <h3>Years to Financial Independence</h3>
                        <p style="color: #666; margin-bottom: 15px;">
                            Calculate how long until you reach your FI number based on current savings and contributions.
                        </p>

                        ${this.getDataStatusHtml()}

                        <div style="margin-bottom: 20px;">
                            <button type="button" onclick="window.modules['years-to-fi'].refreshData()"
                                    style="background: #2196F3; color: white; border: none; padding: 8px 16px;
                                           border-radius: 4px; cursor: pointer;">
                                ↻ Refresh Data from Other Modules
                            </button>
                            <small style="color: #666; display: block; margin-top: 5px;">
                                Click this after updating Budget, Portfolio, or Income data
                            </small>
                        </div>

                        <form id="yearsToFiForm" style="margin-bottom: 20px;">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px;">
                                    FI Number (Target):${fiNumberLabel}
                                </label>
                                <input type="number" id="fiNumber" required step="0.01" min="0" value="${inputs.fiNumber}"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; ${fiNumberStyle}">
                                ${fiNumberReset}
                                ${!inputs.fiNumberCustom ? '<small style="color: #666; display: block; margin-top: 3px;">Auto-populated from Budget module (25× annual expenses)</small>' : ''}
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px;">
                                    Current Portfolio Value:${portfolioLabel}
                                </label>
                                <input type="number" id="currentPortfolio" required step="0.01" min="0" value="${inputs.currentPortfolio}"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; ${portfolioStyle}">
                                ${portfolioReset}
                                ${!inputs.currentPortfolioCustom ? '<small style="color: #666; display: block; margin-top: 3px;">Auto-populated from Portfolio module</small>' : ''}
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px;">
                                    Annual Savings (Contributions + Leftover Cash):${savingsLabel}
                                </label>
                                <input type="number" id="annualSavings" required step="0.01" min="0" value="${inputs.annualSavings}"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; ${savingsStyle}">
                                ${savingsReset}
                                ${!inputs.annualSavingsCustom ? '<small style="color: #666; display: block; margin-top: 3px;">Auto-calculated from Portfolio, Income, and Budget modules</small>' : ''}
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px;">Expected Annual Return (%):</label>
                                <input type="number" id="expectedReturn" required step="0.1" min="0" max="20" value="${inputs.expectedReturn}"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <small style="color: #666; display: block; margin-top: 3px;">
                                    Real return (after inflation). Historical average: ~7%
                                </small>
                            </div>

                            <button type="submit"
                                    style="background: #333; color: white; border: none; padding: 10px 20px;
                                           border-radius: 4px; cursor: pointer; font-size: 1em;">
                                Calculate Years to FI
                            </button>
                        </form>
                    </div>

                    <div class="section" id="resultsSection" style="display: none;">
                        <h3>Results</h3>
                        <div id="resultsDisplay"></div>
                    </div>

                    <div class="section" style="margin-top: 20px;">
                        <h3>Actions</h3>
                        <button onclick="window.modules['years-to-fi'].exportData()"
                                style="background: #666; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Export Data
                        </button>
                        <button onclick="window.modules['years-to-fi'].clearData()"
                                style="background: #999; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer;">
                            Clear All
                        </button>
                    </div>
                </div>
            `;

            // Attach event listeners
            document.getElementById('yearsToFiForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculate();
            });

            // Track changes to mark fields as custom
            document.getElementById('fiNumber').addEventListener('input', () => {
                inputs.fiNumberCustom = true;
                this.save();
                this.render();
            });

            document.getElementById('currentPortfolio').addEventListener('input', () => {
                inputs.currentPortfolioCustom = true;
                this.save();
                this.render();
            });

            document.getElementById('annualSavings').addEventListener('input', () => {
                inputs.annualSavingsCustom = true;
                this.save();
                this.render();
            });

            document.getElementById('expectedReturn').addEventListener('input', () => {
                inputs.expectedReturn = parseFloat(document.getElementById('expectedReturn').value);
                this.save();
            });
        },

        refreshData() {
            console.log('=== Refreshing Data ===');

            // Debug: Check what's available
            if (window.modules?.budget) {
                const budgetData = window.modules.budget.getData();
                console.log('Budget module data:', budgetData);
            } else {
                console.log('Budget module: NOT LOADED');
            }

            if (window.modules?.portfolio) {
                const portfolioData = window.modules.portfolio.getData();
                console.log('Portfolio module data:', portfolioData);
            } else {
                console.log('Portfolio module: NOT LOADED');
            }

            if (window.modules?.income) {
                const incomeData = window.modules.income.getData();
                console.log('Income module data:', incomeData);
            } else {
                console.log('Income module: NOT LOADED');
            }

            // Clear all custom flags to force re-pull from source modules
            inputs.fiNumberCustom = false;
            inputs.currentPortfolioCustom = false;
            inputs.annualSavingsCustom = false;

            // Re-populate from source modules
            this.autoPopulateFields();
            this.save();
            this.render();
        },

        resetField(fieldName) {
            // Clear custom flag
            if (fieldName === 'fiNumber') {
                inputs.fiNumberCustom = false;
            } else if (fieldName === 'currentPortfolio') {
                inputs.currentPortfolioCustom = false;
            } else if (fieldName === 'annualSavings') {
                inputs.annualSavingsCustom = false;
            }

            // Re-populate from source
            this.autoPopulateFields();
            this.save();
            this.render();
        },

        calculate() {
            // Get current values from form
            inputs.fiNumber = parseFloat(document.getElementById('fiNumber').value);
            inputs.currentPortfolio = parseFloat(document.getElementById('currentPortfolio').value);
            inputs.annualSavings = parseFloat(document.getElementById('annualSavings').value);
            inputs.expectedReturn = parseFloat(document.getElementById('expectedReturn').value) / 100;

            // Validate
            if (inputs.fiNumber <= 0 || inputs.currentPortfolio < 0 || inputs.annualSavings < 0) {
                return;
            }

            if (inputs.currentPortfolio >= inputs.fiNumber) {
                // Already at FI
                lastResults = {
                    alreadyFI: true,
                    currentProgress: 100
                };
                this.save();
                this.displayResults(lastResults);
                return;
            }

            if (inputs.annualSavings === 0) {
                return;
            }

            // Simple calculation (with compound growth)
            const yearsSimple = this.calculateYearsToFI(
                inputs.currentPortfolio,
                inputs.fiNumber,
                inputs.annualSavings,
                inputs.expectedReturn
            );

            // Historical simulation
            let historicalResults = null;
            if (window.SimulationEngine && window.SimulationEngine.isDataLoaded()) {
                historicalResults = this.runHistoricalSimulation(
                    inputs.currentPortfolio,
                    inputs.fiNumber,
                    inputs.annualSavings
                );
            }

            // Store results
            lastResults = {
                yearsSimple,
                historicalResults,
                currentProgress: (inputs.currentPortfolio / inputs.fiNumber * 100).toFixed(1)
            };

            this.save();
            this.displayResults(lastResults);
        },

        calculateYearsToFI(currentValue, targetValue, annualSavings, returnRate) {
            // Formula for years to reach target with annual contributions and compound growth
            // FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
            // Solve for n (years)

            if (returnRate === 0) {
                // Simple case: no growth
                return (targetValue - currentValue) / annualSavings;
            }

            // Using logarithmic formula to solve for n
            const adjustedNumerator = Math.log((targetValue * returnRate + annualSavings) / (currentValue * returnRate + annualSavings));
            const denominator = Math.log(1 + returnRate);
            const years = adjustedNumerator / denominator;

            return Math.max(0, years);
        },

        runHistoricalSimulation(startingBalance, targetBalance, annualContribution) {
            // Use historical data to simulate accumulation phase
            const historicalData = window.SimulationEngine.getHistoricalData();
            if (!historicalData || historicalData.length === 0) {
                return null;
            }

            const results = [];
            const maxYears = 50; // Cap at 50 years

            // Try starting from each historical year
            for (let startYear = 0; startYear < historicalData.length - 10; startYear++) {
                let balance = startingBalance;
                let yearsToFI = 0;
                let reachedFI = false;

                for (let year = 0; year < maxYears; year++) {
                    const dataIndex = (startYear + year) % historicalData.length;
                    const yearData = historicalData[dataIndex];

                    // Add annual contribution at beginning of year
                    balance += annualContribution;

                    // Apply market return (assume 60/40 stocks/bonds for accumulation)
                    const stockReturn = yearData.stock_return || 0;
                    const bondReturn = yearData.bond_return || 0;
                    const portfolioReturn = (stockReturn * 0.6) + (bondReturn * 0.4);

                    balance *= (1 + portfolioReturn);

                    // Check if reached FI
                    if (balance >= targetBalance) {
                        yearsToFI = year + 1;
                        reachedFI = true;
                        break;
                    }
                }

                if (reachedFI) {
                    results.push({
                        startYear: historicalData[startYear].year,
                        yearsToFI: yearsToFI
                    });
                }
            }

            if (results.length === 0) {
                return null;
            }

            // Calculate percentiles
            const years = results.map(r => r.yearsToFI).sort((a, b) => a - b);
            const percentile10 = years[Math.floor(years.length * 0.1)];
            const percentile50 = years[Math.floor(years.length * 0.5)];
            const percentile90 = years[Math.floor(years.length * 0.9)];
            const min = years[0];
            const max = years[years.length - 1];

            return {
                scenarios: results,
                totalScenarios: results.length,
                percentile10,
                percentile50,
                percentile90,
                min,
                max
            };
        },

        displayResults(results) {
            const resultsSection = document.getElementById('resultsSection');
            const resultsDisplay = document.getElementById('resultsDisplay');

            resultsSection.style.display = 'block';

            // Check if already at FI
            if (results.alreadyFI) {
                resultsDisplay.innerHTML = `
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 4px; text-align: center;">
                        <h3 style="color: #2e7d32; margin: 0 0 10px 0;">🎉 Congratulations!</h3>
                        <p style="font-size: 1.2em; margin: 0;">
                            You've already reached Financial Independence!
                        </p>
                    </div>
                `;
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }

            const yearsSimple = results.yearsSimple;
            const currentProgress = results.currentProgress;

            let html = `
                <div style="background: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                    <div style="margin-bottom: 15px;">
                        <strong>Current Progress:</strong> ${currentProgress}% to FI
                    </div>
                    <div style="background: #e0e0e0; height: 24px; border-radius: 4px; overflow: hidden; margin-bottom: 15px;">
                        <div style="background: #5cb85c; height: 100%; width: ${Math.min(currentProgress, 100)}%;
                                   transition: width 0.3s ease; display: flex; align-items: center;
                                   justify-content: center; color: white; font-size: 0.85em;">
                            ${currentProgress >= 10 ? currentProgress + '%' : ''}
                        </div>
                    </div>
                </div>

                <div style="background: #e3f2fd; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">Simple Calculation</h4>
                    <div style="font-size: 1.5em; margin-bottom: 10px;">
                        <strong>${yearsSimple.toFixed(1)} years</strong>
                    </div>
                    <div style="color: #666; font-size: 0.9em;">
                        Assumes ${(inputs.expectedReturn * 100).toFixed(1)}% annual return
                    </div>
                </div>
            `;

            // Add historical results if available
            if (results.historicalResults) {
                const hist = results.historicalResults;
                html += `
                    <div style="background: #fff3e0; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0;">Historical Analysis</h4>
                        <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
                            Based on ${hist.totalScenarios} historical market scenarios (1871-2024)
                        </p>
                        <div style="margin-bottom: 10px;">
                            <strong>Range:</strong> ${hist.min}-${hist.max} years
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Best case (10th percentile):</strong> ${hist.percentile10} years
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Median (50th percentile):</strong> ${hist.percentile50} years
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Worst case (90th percentile):</strong> ${hist.percentile90} years
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div style="background: #fff3e0; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0;">Historical Analysis</h4>
                        <p style="color: #999;">
                            Historical data not loaded. Refresh the page to enable historical analysis.
                        </p>
                    </div>
                `;
            }

            resultsDisplay.innerHTML = html;
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        },

        save() {
            StateManager.save('years-to-fi', { inputs, lastResults });
        },

        exportData() {
            const data = { inputs, lastResults };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `years-to-fi-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        clearData() {
            if (confirm('Are you sure you want to clear all Years to FI data? This cannot be undone.')) {
                inputs = {
                    fiNumber: 0,
                    fiNumberCustom: false,
                    currentPortfolio: 0,
                    currentPortfolioCustom: false,
                    annualSavings: 0,
                    annualSavingsCustom: false,
                    expectedReturn: 7.0
                };
                lastResults = null;
                this.save();
                this.init();
            }
        },

        // Public API for other modules
        getData() {
            return {
                inputs,
                lastResults
            };
        }
    };
})();
