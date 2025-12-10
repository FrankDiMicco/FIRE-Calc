// Retirement Simulator Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }

    // Module state
    let inputs = {
        startingBalance: 1000000,
        annualWithdrawal: 40000,
        duration: 30,
        allocation: {
            stocks: 60,
            bonds: 30,
            cash: 10
        }
    };

    let lastResults = null;

    // Module definition
    window.modules['retirement-sim'] = {
        init() {
            // Load saved data
            const savedData = StateManager.load('retirement-sim');
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
                <div class="retirement-sim-module">
                    <div class="section">
                        <h3>Simulation Settings</h3>

                        <form id="simulationForm" style="margin-bottom: 20px;">
                            <!-- Quick Fill Buttons -->
                            <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
                                <h4 style="margin-top: 0;">Quick Fill Options</h4>
                                <button type="button" id="pullPortfolioBtn" onclick="window.modules['retirement-sim'].pullFromPortfolio()"
                                        style="background: #666; color: white; border: none; padding: 8px 16px;
                                               border-radius: 4px; cursor: pointer; margin-right: 10px;">
                                    Pull from Portfolio
                                </button>
                                <button type="button" id="pullBudgetBtn" onclick="window.modules['retirement-sim'].pullFromBudget()"
                                        style="background: #666; color: white; border: none; padding: 8px 16px;
                                               border-radius: 4px; cursor: pointer;">
                                    Pull from Budget
                                </button>
                            </div>

                            <!-- Starting Balance -->
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Starting Portfolio Balance:</label>
                                <input type="number" id="startingBalance" required step="1000" min="0"
                                       value="${inputs.startingBalance}"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <small style="color: #666;">Total value of your retirement portfolio</small>
                            </div>

                            <!-- Annual Withdrawal -->
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Annual Withdrawal:</label>
                                <input type="number" id="annualWithdrawal" required step="1000" min="0"
                                       value="${inputs.annualWithdrawal}"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <small style="color: #666;">First year withdrawal (adjusted for inflation each year)</small>
                            </div>

                            <!-- Duration -->
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Retirement Duration (years):</label>
                                <input type="number" id="duration" required step="1" min="1" max="60"
                                       value="${inputs.duration}"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <small style="color: #666;">How many years to test (typical: 30 years)</small>
                            </div>

                            <!-- Asset Allocation -->
                            <div style="margin-bottom: 15px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
                                <label style="display: block; margin-bottom: 10px; font-weight: bold;">Asset Allocation:</label>

                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Stocks %:</label>
                                    <input type="number" id="stocksPercent" min="0" max="100" step="1"
                                           value="${inputs.allocation.stocks}"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Bonds %:</label>
                                    <input type="number" id="bondsPercent" min="0" max="100" step="1"
                                           value="${inputs.allocation.bonds}"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Cash %:</label>
                                    <input type="number" id="cashPercent" min="0" max="100" step="1"
                                           value="${inputs.allocation.cash}"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>

                                <div id="allocationTotal" style="margin-top: 10px; font-weight: bold;">
                                    Total: <span id="allocationTotalValue">100</span>%
                                </div>
                                <div id="allocationWarning" style="color: #d9534f; font-size: 0.85em; margin-top: 5px; display: none;">
                                    ⚠ Allocation must total 100%
                                </div>
                            </div>

                            <button type="submit" id="runSimulationBtn"
                                    style="background: #333; color: white; border: none; padding: 12px 24px;
                                           border-radius: 4px; cursor: pointer; font-size: 1em; font-weight: bold;">
                                Run Historical Simulation
                            </button>
                        </form>
                    </div>

                    <div class="section" id="resultsSection" style="display: none;">
                        <!-- Results will be displayed here -->
                    </div>

                    <div class="section" style="margin-top: 20px;">
                        <h3>Actions</h3>
                        <button onclick="window.modules['retirement-sim'].exportData()"
                                style="background: #666; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Export Data
                        </button>
                        <button onclick="window.modules['retirement-sim'].clearData()"
                                style="background: #999; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Clear All
                        </button>
                        <button onclick="closeModule()"
                                style="background: #333; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer;">
                            Close
                        </button>
                    </div>
                </div>
            `;

            // Attach event listeners
            document.getElementById('simulationForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.runSimulation();
            });

            // Real-time allocation validation
            const stocksInput = document.getElementById('stocksPercent');
            const bondsInput = document.getElementById('bondsPercent');
            const cashInput = document.getElementById('cashPercent');

            const updateAllocationTotal = () => {
                const stocks = parseFloat(stocksInput.value) || 0;
                const bonds = parseFloat(bondsInput.value) || 0;
                const cash = parseFloat(cashInput.value) || 0;
                const total = stocks + bonds + cash;

                document.getElementById('allocationTotalValue').textContent = total.toFixed(0);

                const warning = document.getElementById('allocationWarning');
                if (Math.abs(total - 100) > 0.1) {
                    warning.style.display = 'block';
                } else {
                    warning.style.display = 'none';
                }
            };

            stocksInput.addEventListener('input', updateAllocationTotal);
            bondsInput.addEventListener('input', updateAllocationTotal);
            cashInput.addEventListener('input', updateAllocationTotal);
        },

        runSimulation() {
            // Collect inputs
            inputs = {
                startingBalance: parseFloat(document.getElementById('startingBalance').value),
                annualWithdrawal: parseFloat(document.getElementById('annualWithdrawal').value),
                duration: parseInt(document.getElementById('duration').value),
                allocation: {
                    stocks: parseFloat(document.getElementById('stocksPercent').value),
                    bonds: parseFloat(document.getElementById('bondsPercent').value),
                    cash: parseFloat(document.getElementById('cashPercent').value)
                }
            };

            // Validate allocation
            const allocationTotal = inputs.allocation.stocks + inputs.allocation.bonds + inputs.allocation.cash;
            if (Math.abs(allocationTotal - 100) > 0.1) {
                alert(`Asset allocation must total 100% (currently ${allocationTotal.toFixed(1)}%)`);
                return;
            }

            // Show loading message
            const resultsSection = document.getElementById('resultsSection');
            resultsSection.style.display = 'block';
            resultsSection.innerHTML = '<p style="text-align: center; padding: 40px;">Running simulation across all historical periods...<br><small>This may take a few seconds</small></p>';

            // Run simulation (async to allow UI update)
            setTimeout(() => {
                try {
                    const results = SimulationEngine.runWithdrawalSimulation(inputs);
                    lastResults = results;
                    this.displayResults(results);
                    this.save();
                } catch (error) {
                    console.error('Simulation error:', error);
                    resultsSection.innerHTML = `
                        <div style="background: #f8d7da; padding: 20px; border-radius: 4px; color: #721c24;">
                            <strong>Error:</strong> ${error.message}
                        </div>
                    `;
                }
            }, 100);
        },

        displayResults(results) {
            const container = document.getElementById('resultsSection');
            container.style.display = 'block';

            const successCount = Math.round(results.totalScenarios * results.successRate);
            const failureCount = results.totalScenarios - successCount;

            // Determine success color
            const successColor = results.successRate >= 0.95 ? '#5cb85c' :
                                results.successRate >= 0.85 ? '#f0ad4e' : '#d9534f';

            container.innerHTML = `
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                    <h3>Simulation Results</h3>
                    <p style="color: #666; margin-bottom: 20px;">
                        Tested ${results.totalScenarios} historical ${results.totalScenarios === 1 ? 'period' : 'periods'}
                        (${results.inputParams.duration}-year retirements starting from 1871-${2024 - results.inputParams.duration + 1})
                    </p>

                    <!-- Success Rate -->
                    <div style="margin: 20px 0; padding: 20px; background: white; border-radius: 4px;">
                        <div style="font-size: 2em; font-weight: bold; color: ${successColor};">
                            ${(results.successRate * 100).toFixed(1)}% Success Rate
                        </div>
                        <div style="color: #666; margin-top: 5px; font-size: 1.1em;">
                            ${successCount} of ${results.totalScenarios} historical periods succeeded
                        </div>
                        <div style="background: #e0e0e0; height: 30px; border-radius: 4px; margin-top: 15px; overflow: hidden;">
                            <div style="background: ${successColor}; height: 100%; width: ${results.successRate * 100}%;
                                       transition: width 0.5s ease;"></div>
                        </div>
                        <div style="color: #666; font-size: 0.9em; margin-top: 10px;">
                            ${failureCount > 0 ?
                                `<span style="color: #d9534f;">⚠ ${failureCount} ${failureCount === 1 ? 'period' : 'periods'} ran out of money</span>` :
                                '<span style="color: #5cb85c;">✓ Portfolio survived all historical periods!</span>'}
                        </div>
                    </div>

                    <!-- Percentiles - Now showing inflation-adjusted values -->
                    <div style="margin: 20px 0; padding: 20px; background: white; border-radius: 4px;">
                        <h4 style="margin-top: 0;">Final Balance Distribution (Successful Scenarios)</h4>
                        <p style="color: #666; font-size: 0.85em; margin-bottom: 15px;">
                            All values in today's dollars (inflation-adjusted) for meaningful comparison
                        </p>
                        ${successCount > 0 ? `
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 8px;">5th Percentile (Worst 5%):</td>
                                    <td style="text-align: right; padding: 8px; font-weight: bold;">
                                        $${results.statistics.finalBalance.percentile5.toLocaleString('en-US', {maximumFractionDigits: 0})}
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 8px;">25th Percentile:</td>
                                    <td style="text-align: right; padding: 8px; font-weight: bold;">
                                        $${results.statistics.finalBalance.percentile25.toLocaleString('en-US', {maximumFractionDigits: 0})}
                                    </td>
                                </tr>
                                <tr style="background: #fffacd; border-bottom: 1px solid #ddd;">
                                    <td style="padding: 8px;"><strong>50th Percentile (Median):</strong></td>
                                    <td style="text-align: right; padding: 8px; font-weight: bold;">
                                        $${results.statistics.finalBalance.percentile50.toLocaleString('en-US', {maximumFractionDigits: 0})}
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 8px;">75th Percentile:</td>
                                    <td style="text-align: right; padding: 8px; font-weight: bold;">
                                        $${results.statistics.finalBalance.percentile75.toLocaleString('en-US', {maximumFractionDigits: 0})}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px;">95th Percentile (Best 5%):</td>
                                    <td style="text-align: right; padding: 8px; font-weight: bold;">
                                        $${results.statistics.finalBalance.percentile95.toLocaleString('en-US', {maximumFractionDigits: 0})}
                                    </td>
                                </tr>
                            </table>
                        ` : '<p style="color: #999;">No successful scenarios to analyze</p>'}
                    </div>

                    <!-- Best/Worst Cases -->
                    <div style="margin: 20px 0;">
                        <h4>Best & Worst Case Scenarios</h4>
                        <p style="color: #666; font-size: 0.85em; margin-bottom: 10px;">
                            Final balances shown in today's dollars (inflation-adjusted)
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                            ${results.statistics.bestCase ? `
                                <div style="background: #d4edda; padding: 15px; border-radius: 4px; border-left: 4px solid #5cb85c;">
                                    <div style="font-weight: bold; color: #155724; margin-bottom: 5px;">Best Case</div>
                                    <div style="font-size: 0.9em;">Retired in: ${results.statistics.bestCase.startYearActual}</div>
                                    <div style="font-size: 1.2em; font-weight: bold; margin-top: 10px;">
                                        Final: $${results.statistics.bestCase.finalBalance.toLocaleString('en-US', {maximumFractionDigits: 0})}
                                    </div>
                                    ${results.statistics.bestCase.finalBalanceNominal ? `
                                        <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
                                            (Nominal: $${results.statistics.bestCase.finalBalanceNominal.toLocaleString('en-US', {maximumFractionDigits: 0})})
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            ${results.statistics.worstCase ? `
                                <div style="background: #f8d7da; padding: 15px; border-radius: 4px; border-left: 4px solid #d9534f;">
                                    <div style="font-weight: bold; color: #721c24; margin-bottom: 5px;">Worst Case</div>
                                    <div style="font-size: 0.9em;">Retired in: ${results.statistics.worstCase.startYearActual}</div>
                                    <div style="font-size: 1.2em; font-weight: bold; margin-top: 10px;">
                                        ${results.statistics.worstCase.success ?
                                            'Final: $' + results.statistics.worstCase.finalBalance.toLocaleString('en-US', {maximumFractionDigits: 0}) :
                                            'Failed in year ' + results.statistics.worstCase.failureYear}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Withdrawal Rate Info -->
                    <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 4px; border-left: 4px solid #0275d8;">
                        <strong>Your Withdrawal Rate:</strong>
                        ${((results.inputParams.annualWithdrawal / results.inputParams.startingBalance) * 100).toFixed(2)}%
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            The classic "4% rule" suggests a 4% initial withdrawal rate for 30-year retirements.
                            Your rate: ${((results.inputParams.annualWithdrawal / results.inputParams.startingBalance) * 100).toFixed(2)}%
                        </div>
                    </div>

                    <!-- Methodology Note -->
                    <div style="margin: 20px 0; padding: 15px; background: #e7f3ff; border-radius: 4px; border-left: 4px solid #0275d8;">
                        <strong>About These Results</strong>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            This simulation uses historical market data from 1871-2024. All ending balances are shown
                            in <strong>today's dollars</strong> (inflation-adjusted) so you can compare purchasing power
                            directly to your starting balance. This methodology matches FICalc and other industry-standard
                            retirement calculators.
                        </div>
                    </div>
                </div>
            `;
        },

        pullFromPortfolio() {
            try {
                if (!window.modules['portfolio']) {
                    alert('Portfolio module not loaded. Please configure your portfolio first.');
                    return;
                }

                const portfolioData = window.modules['portfolio'].getData();

                if (!portfolioData || portfolioData.totalValue === 0) {
                    alert('No portfolio data available. Please add accounts to your portfolio first.');
                    return;
                }

                // Populate starting balance
                document.getElementById('startingBalance').value = portfolioData.totalValue;

                // Populate allocation
                document.getElementById('stocksPercent').value = portfolioData.allocation.stocks.toFixed(1);
                document.getElementById('bondsPercent').value = portfolioData.allocation.bonds.toFixed(1);
                document.getElementById('cashPercent').value = portfolioData.allocation.cash.toFixed(1);

                // Trigger allocation total update
                document.getElementById('stocksPercent').dispatchEvent(new Event('input'));

                // Visual feedback
                const btn = document.getElementById('pullPortfolioBtn');
                const originalText = btn.textContent;
                btn.textContent = 'Pulled from Portfolio ✓';
                btn.style.background = '#5cb85c';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#666';
                }, 2000);

            } catch (error) {
                console.error('Error pulling portfolio data:', error);
                alert('Failed to load portfolio data. Make sure Portfolio module is configured.');
            }
        },

        pullFromBudget() {
            try {
                if (!window.modules['budget']) {
                    alert('Budget module not loaded. Please configure your budget first.');
                    return;
                }

                const budgetData = window.modules['budget'].getData();

                if (!budgetData || budgetData.annualTotal === 0) {
                    alert('No budget data available. Please add expenses to your budget first.');
                    return;
                }

                // Populate annual withdrawal
                document.getElementById('annualWithdrawal').value = budgetData.annualTotal;

                // Visual feedback
                const btn = document.getElementById('pullBudgetBtn');
                const originalText = btn.textContent;
                btn.textContent = 'Pulled from Budget ✓';
                btn.style.background = '#5cb85c';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#666';
                }, 2000);

            } catch (error) {
                console.error('Error pulling budget data:', error);
                alert('Failed to load budget data. Make sure Budget module is configured.');
            }
        },

        save() {
            StateManager.save('retirement-sim', { inputs, lastResults });
        },

        exportData() {
            const data = {
                inputs,
                lastResults
            };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `retirement-simulation-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        clearData() {
            if (confirm('Are you sure you want to clear all simulation data? This cannot be undone.')) {
                inputs = {
                    startingBalance: 1000000,
                    annualWithdrawal: 40000,
                    duration: 30,
                    allocation: { stocks: 60, bonds: 30, cash: 10 }
                };
                lastResults = null;
                this.save();
                this.render();
                document.getElementById('resultsSection').style.display = 'none';
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
