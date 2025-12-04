// Historical Backtesting Simulation Engine
// Pure computation functions - no UI, no state
(function() {

    // Cached historical data
    let historicalData = null;

    const SimulationEngine = {

        /**
         * Load Shiller historical data from JSON file
         * @returns {Promise<Array>} Historical data array
         */
        async loadHistoricalData() {
            if (historicalData) {
                return historicalData; // Use cached data
            }

            try {
                const response = await fetch('shiller_annual_data11262025.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Validate data structure
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('Invalid data format: expected array');
                }

                // Validate first entry has required fields
                const firstEntry = data[0];
                if (typeof firstEntry.year !== 'number' ||
                    typeof firstEntry.stock_return !== 'number' ||
                    typeof firstEntry.bond_return !== 'number' ||
                    typeof firstEntry.inflation !== 'number') {
                    throw new Error('Data missing required fields');
                }

                historicalData = data;
                console.log(`✓ Loaded ${data.length} years of historical data (${data[0].year}-${data[data.length-1].year})`);
                return data;

            } catch (error) {
                console.error('Failed to load historical data:', error);
                throw new Error('Failed to load historical market data: ' + error.message);
            }
        },

        /**
         * Main withdrawal simulation - tests all historical periods
         * @param {Object} params - Simulation parameters
         * @param {number} params.startingBalance - Initial portfolio value
         * @param {number} params.annualWithdrawal - First year withdrawal amount
         * @param {number} params.duration - Years in retirement
         * @param {Object} params.allocation - Asset allocation {stocks, bonds, cash}
         * @returns {Object} Simulation results with success rate and statistics
         */
        runWithdrawalSimulation(params) {
            // Validate params
            this.validateParams(params);

            // Ensure data is loaded
            if (!historicalData) {
                throw new Error('Historical data not loaded. Call loadHistoricalData() first.');
            }

            console.log('Running withdrawal simulation...');
            console.log('  Starting Balance:', params.startingBalance.toLocaleString());
            console.log('  Annual Withdrawal:', params.annualWithdrawal.toLocaleString());
            console.log('  Duration:', params.duration, 'years');
            console.log('  Allocation:', `${params.allocation.stocks}% stocks, ${params.allocation.bonds}% bonds, ${params.allocation.cash}% cash`);

            const scenarios = this.generateWithdrawalScenarios(params);
            const statistics = this.calculateStatistics(scenarios);

            const successCount = scenarios.filter(s => s.success).length;
            const failureCount = scenarios.length - successCount;

            console.log(`✓ Simulation complete: ${successCount} successes, ${failureCount} failures`);

            return {
                inputParams: params,
                totalScenarios: scenarios.length,
                successRate: successCount / scenarios.length,
                failureRate: failureCount / scenarios.length,
                statistics: statistics,
                scenarios: scenarios
            };
        },

        /**
         * Generate all withdrawal scenarios across historical periods
         * @param {Object} params - Simulation parameters
         * @returns {Array} Array of scenario results
         */
        generateWithdrawalScenarios(params) {
            const { startingBalance, annualWithdrawal, duration, allocation } = params;
            const scenarios = [];
            const maxStartIndex = historicalData.length - duration;

            // Test each possible starting year
            for (let i = 0; i <= maxStartIndex; i++) {
                const yearData = historicalData.slice(i, i + duration);
                const scenario = this.simulateSingleWithdrawal(
                    startingBalance,
                    annualWithdrawal,
                    allocation,
                    yearData,
                    i
                );
                scenarios.push(scenario);
            }

            return scenarios;
        },

        /**
         * Simulate single withdrawal scenario
         * @param {number} balance - Starting portfolio balance
         * @param {number} withdrawal - Initial annual withdrawal
         * @param {Object} allocation - Asset allocation percentages
         * @param {Array} yearsData - Historical data for this period
         * @param {number} startIndex - Index in historical data array
         * @returns {Object} Scenario result
         */
        simulateSingleWithdrawal(balance, withdrawal, allocation, yearsData, startIndex) {
            const yearlyBalances = [balance];
            let currentBalance = balance;
            let currentWithdrawal = withdrawal;
            let totalWithdrawn = 0;

            for (let year = 0; year < yearsData.length; year++) {
                // 1. Withdraw at start of year
                currentBalance -= currentWithdrawal;
                totalWithdrawn += currentWithdrawal;

                // 2. Check for failure (portfolio depleted)
                if (currentBalance <= 0) {
                    return {
                        startIndex: startIndex,
                        startYearActual: historicalData[startIndex].year,
                        success: false,
                        failureYear: year + 1,
                        finalBalance: 0,
                        yearlyBalances: yearlyBalances,
                        totalWithdrawn: totalWithdrawn
                    };
                }

                // 3. Apply portfolio returns
                const portfolioReturn = this.calculatePortfolioReturn(
                    yearsData[year],
                    allocation
                );
                currentBalance *= (1 + portfolioReturn);

                // 4. Inflate withdrawal for next year
                if (year < yearsData.length - 1) {
                    currentWithdrawal *= (1 + yearsData[year].inflation);
                }

                yearlyBalances.push(currentBalance);
            }

            // Success - portfolio lasted entire duration
            return {
                startIndex: startIndex,
                startYearActual: historicalData[startIndex].year,
                success: true,
                failureYear: null,
                finalBalance: currentBalance,
                yearlyBalances: yearlyBalances,
                totalWithdrawn: totalWithdrawn
            };
        },

        /**
         * Calculate portfolio return for one year based on allocation
         * @param {Object} yearData - Historical data for one year
         * @param {Object} allocation - Asset allocation percentages
         * @returns {number} Weighted portfolio return (decimal)
         */
        calculatePortfolioReturn(yearData, allocation) {
            const stockReturn = (yearData.stock_return || 0) * (allocation.stocks / 100);
            const bondReturn = (yearData.bond_return || 0) * (allocation.bonds / 100);
            const cashReturn = 0; // Assume 0% nominal return for cash

            return stockReturn + bondReturn + cashReturn;
        },

        /**
         * Calculate aggregate statistics across all scenarios
         * @param {Array} scenarios - All scenario results
         * @returns {Object} Statistics object
         */
        calculateStatistics(scenarios) {
            const successfulScenarios = scenarios.filter(s => s.success);
            const failedScenarios = scenarios.filter(s => !s.success);

            // If no successful scenarios, return minimal stats
            if (successfulScenarios.length === 0) {
                return {
                    finalBalance: {
                        percentile5: 0,
                        percentile25: 0,
                        percentile50: 0,
                        percentile75: 0,
                        percentile95: 0
                    },
                    bestCase: null,
                    worstCase: failedScenarios[0] || null,
                    medianCase: null
                };
            }

            // Final balances (successful scenarios only)
            const finalBalances = successfulScenarios
                .map(s => s.finalBalance)
                .sort((a, b) => a - b);

            // Calculate percentiles
            const percentiles = {
                percentile5: this.calculatePercentile(finalBalances, 5),
                percentile25: this.calculatePercentile(finalBalances, 25),
                percentile50: this.calculatePercentile(finalBalances, 50),
                percentile75: this.calculatePercentile(finalBalances, 75),
                percentile95: this.calculatePercentile(finalBalances, 95)
            };

            // Best case (highest final balance)
            const bestCase = successfulScenarios.reduce((best, s) =>
                s.finalBalance > best.finalBalance ? s : best
            , successfulScenarios[0]);

            // Worst case (earliest failure or lowest balance)
            let worstCase;
            if (failedScenarios.length > 0) {
                worstCase = failedScenarios.reduce((worst, s) =>
                    s.failureYear < worst.failureYear ? s : worst
                , failedScenarios[0]);
            } else {
                worstCase = successfulScenarios.reduce((worst, s) =>
                    s.finalBalance < worst.finalBalance ? s : worst
                , successfulScenarios[0]);
            }

            // Median case
            const medianIndex = Math.floor(successfulScenarios.length / 2);
            const medianCase = successfulScenarios
                .sort((a, b) => a.finalBalance - b.finalBalance)[medianIndex];

            return {
                finalBalance: percentiles,
                bestCase: bestCase,
                worstCase: worstCase,
                medianCase: medianCase
            };
        },

        /**
         * Calculate percentile value from sorted array
         * @param {Array} sortedArray - Sorted array of numbers
         * @param {number} percentile - Percentile to calculate (0-100)
         * @returns {number} Value at percentile
         */
        calculatePercentile(sortedArray, percentile) {
            if (sortedArray.length === 0) return 0;
            const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
            return sortedArray[Math.max(0, index)];
        },

        /**
         * Validate input parameters
         * @param {Object} params - Parameters to validate
         * @throws {Error} If validation fails
         */
        validateParams(params) {
            const errors = [];

            // Starting balance
            if (!params.startingBalance || params.startingBalance <= 0) {
                errors.push('Starting balance must be greater than $0');
            }
            if (params.startingBalance > 1000000000) {
                errors.push('Starting balance exceeds $1 billion - please verify');
            }

            // Annual withdrawal
            if (!params.annualWithdrawal || params.annualWithdrawal <= 0) {
                errors.push('Annual withdrawal must be greater than $0');
            }
            if (params.annualWithdrawal > params.startingBalance) {
                errors.push('Annual withdrawal cannot exceed starting balance');
            }

            // Duration
            if (!params.duration || params.duration < 1) {
                errors.push('Duration must be at least 1 year');
            }
            if (params.duration > 100) {
                errors.push('Duration cannot exceed 100 years');
            }
            if (historicalData && params.duration > historicalData.length - 1) {
                errors.push(`Duration cannot exceed ${historicalData.length - 1} years (limited by historical data)`);
            }

            // Allocation
            if (!params.allocation) {
                errors.push('Asset allocation is required');
            } else {
                const total = params.allocation.stocks + params.allocation.bonds + params.allocation.cash;
                if (Math.abs(total - 100) > 0.01) {
                    errors.push(`Asset allocation must total 100% (currently ${total.toFixed(1)}%)`);
                }

                // Check for negative values
                if (params.allocation.stocks < 0 || params.allocation.bonds < 0 || params.allocation.cash < 0) {
                    errors.push('Asset allocation percentages cannot be negative');
                }
            }

            if (errors.length > 0) {
                throw new Error('Validation failed:\n' + errors.join('\n'));
            }
        }
    };

    // Expose globally
    window.SimulationEngine = SimulationEngine;

    // Auto-load historical data on script load
    if (typeof fetch !== 'undefined') {
        SimulationEngine.loadHistoricalData().catch(error => {
            console.error('Auto-load failed:', error.message);
        });
    }

})();
