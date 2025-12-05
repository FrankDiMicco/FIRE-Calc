// Years to FI Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }

    // Module state
    let inputs = {
        fiNumber: 0,
        currentPortfolio: 0,
        annualSavings: 0,
        expectedReturn: 7.0 // Default 7% real return
    };
    let lastResults = null;

    // Module definition
    window.modules['years-to-fi'] = {
        init() {
            // Load saved data
            const savedData = StateManager.load('years-to-fi');
            if (savedData) {
                inputs = savedData.inputs || inputs;
                lastResults = savedData.lastResults || null;
            }

            // Render the module UI
            this.render();

            // Display last results if any
            if (lastResults) {
                this.displayResults(lastResults);
            }
        },

        render() {
            const container = document.getElementById('modalBody');

            container.innerHTML = `
                <div class="years-to-fi-module">
                    <div class="section">
                        <h3>Years to Financial Independence</h3>
                        <p style="color: #666; margin-bottom: 20px;">
                            Calculate how long until you reach your FI number based on current savings and contributions.
                        </p>

                        <form id="yearsToFiForm" style="margin-bottom: 20px;">
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">FI Number (Target):</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="number" id="fiNumber" required step="0.01" min="0" value="${inputs.fiNumber}"
                                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <button type="button" onclick="window.modules['years-to-fi'].pullFromBudget()"
                                            style="background: #666; color: white; border: none; padding: 8px 16px;
                                                   border-radius: 4px; cursor: pointer; white-space: nowrap;">
                                        Pull from Budget
                                    </button>
                                </div>
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Current Portfolio Value:</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="number" id="currentPortfolio" required step="0.01" min="0" value="${inputs.currentPortfolio}"
                                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <button type="button" onclick="window.modules['years-to-fi'].pullFromPortfolio()"
                                            style="background: #666; color: white; border: none; padding: 8px 16px;
                                                   border-radius: 4px; cursor: pointer; white-space: nowrap;">
                                        Pull from Portfolio
                                    </button>
                                </div>
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Annual Savings (Employee Contributions + Leftover Cash):</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="number" id="annualSavings" required step="0.01" min="0" value="${inputs.annualSavings}"
                                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <button type="button" onclick="window.modules['years-to-fi'].pullSavingsRate()"
                                            style="background: #666; color: white; border: none; padding: 8px 16px;
                                                   border-radius: 4px; cursor: pointer; white-space: nowrap;">
                                        Auto-Calculate
                                    </button>
                                </div>
                                <small style="color: #666; display: block; margin-top: 3px;">
                                    This is how much you save per year (not including employer match)
                                </small>
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
        },

        pullFromBudget() {
            try {
                if (window.modules['budget'] && window.modules['budget'].getData) {
                    const budgetData = window.modules['budget'].getData();
                    if (budgetData.fiNumber > 0) {
                        document.getElementById('fiNumber').value = budgetData.fiNumber.toFixed(2);
                        alert(`Pulled FI Number: $${budgetData.fiNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                    } else {
                        alert('No FI number found in Budget module. Add expenses first.');
                    }
                } else {
                    alert('Budget module not available. Please add expenses in the Budget module first.');
                }
            } catch (e) {
                alert('Error pulling from Budget module: ' + e.message);
            }
        },

        pullFromPortfolio() {
            try {
                if (window.modules['portfolio'] && window.modules['portfolio'].getData) {
                    const portfolioData = window.modules['portfolio'].getData();
                    if (portfolioData.totalValue > 0) {
                        document.getElementById('currentPortfolio').value = portfolioData.totalValue.toFixed(2);
                        alert(`Pulled Portfolio Value: $${portfolioData.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                    } else {
                        alert('No portfolio value found. Add accounts in the Portfolio module first.');
                    }
                } else {
                    alert('Portfolio module not available. Please add accounts first.');
                }
            } catch (e) {
                alert('Error pulling from Portfolio module: ' + e.message);
            }
        },

        pullSavingsRate() {
            try {
                // Get data from all three modules
                const portfolioData = window.modules['portfolio']?.getData();
                const incomeData = window.modules['income']?.getData();
                const budgetData = window.modules['budget']?.getData();

                if (!portfolioData || !incomeData || !budgetData) {
                    alert('Need Portfolio, Income, and Budget data to auto-calculate savings. Please fill those modules first.');
                    return;
                }

                // Calculate annual savings = contributions + leftover cash
                const contributions = portfolioData.totalContributions || 0;
                const leftoverCash = incomeData.annualTotal - budgetData.annualTotal;
                const totalSavings = contributions + Math.max(0, leftoverCash);

                if (totalSavings > 0) {
                    document.getElementById('annualSavings').value = totalSavings.toFixed(2);
                    alert(`Auto-calculated Annual Savings: $${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
                          `Breakdown:\n` +
                          `- Contributions: $${contributions.toLocaleString()}\n` +
                          `- Leftover Cash: $${Math.max(0, leftoverCash).toLocaleString()}`);
                } else {
                    alert('No savings detected. Your expenses exceed your income.');
                }
            } catch (e) {
                alert('Error calculating savings: ' + e.message);
            }
        },

        calculate() {
            // Get inputs
            const fiNumber = parseFloat(document.getElementById('fiNumber').value);
            const currentPortfolio = parseFloat(document.getElementById('currentPortfolio').value);
            const annualSavings = parseFloat(document.getElementById('annualSavings').value);
            const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) / 100;

            // Validate
            if (fiNumber <= 0 || currentPortfolio < 0 || annualSavings < 0) {
                alert('Please enter valid positive numbers.');
                return;
            }

            if (currentPortfolio >= fiNumber) {
                alert('Congratulations! You\'ve already reached FI! 🎉');
                return;
            }

            if (annualSavings === 0) {
                alert('You need to save money to reach FI. Annual savings cannot be zero.');
                return;
            }

            // Save inputs
            inputs = { fiNumber, currentPortfolio, annualSavings, expectedReturn };

            // Simple calculation (with compound growth)
            const yearsSimple = this.calculateYearsToFI(currentPortfolio, fiNumber, annualSavings, expectedReturn);

            // Historical simulation
            let historicalResults = null;
            if (window.SimulationEngine && window.SimulationEngine.isDataLoaded()) {
                historicalResults = this.runHistoricalSimulation(currentPortfolio, fiNumber, annualSavings);
            }

            // Store results
            lastResults = {
                yearsSimple,
                historicalResults,
                currentProgress: (currentPortfolio / fiNumber * 100).toFixed(1)
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
            const remaining = targetValue - currentValue;
            const numerator = Math.log((targetValue * returnRate / annualSavings) + 1);
            const denominator = Math.log(1 + returnRate);

            // Adjust for current portfolio
            const adjustedNumerator = Math.log((targetValue * returnRate + annualSavings) / (currentValue * returnRate + annualSavings));
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
                    currentPortfolio: 0,
                    annualSavings: 0,
                    expectedReturn: 7.0
                };
                lastResults = null;
                this.save();
                this.render();
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
