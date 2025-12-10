// Portfolio Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }

    // Portfolio module state
    let accounts = [];
    let editingAccountId = null; // Track if we're editing an account

    // Module definition
    window.modules['portfolio'] = {
        init() {
            // Load saved accounts
            const savedData = StateManager.load('portfolio');
            if (savedData && savedData.accounts) {
                accounts = savedData.accounts;
            }

            // Render the module UI
            this.render();
        },

        render() {
            const container = document.getElementById('modalBody');

            container.innerHTML = `
                <div class="portfolio-module">
                    <div class="section">
                        <button id="toggleAccountFormBtn"
                                style="background: #333; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-bottom: 15px;">
                            + Add Account
                        </button>
                        <div id="accountFormContainer" style="display: none;">
                            <h3>Add Account</h3>
                            <form id="addAccountForm" style="margin-bottom: 20px;">
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Account Name:</label>
                                <input type="text" id="accountName" required placeholder="e.g., My Vanguard 401k"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Account Type:</label>
                                <select id="accountType" required
                                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="">Select type...</option>
                                    <option value="529">529</option>
                                    <option value="403b">403b</option>
                                    <option value="Brokerage/Taxable">Brokerage/Taxable</option>
                                    <option value="Crypto">Crypto</option>
                                    <option value="ESOP">ESOP</option>
                                    <option value="Gold">Gold</option>
                                    <option value="HSA">HSA</option>
                                    <option value="Other">Other</option>
                                    <option value="Roth 401k">Roth 401k</option>
                                    <option value="Roth IRA">Roth IRA</option>
                                    <option value="Savings/Checking">Savings/Checking</option>
                                    <option value="Traditional 401k">Traditional 401k</option>
                                    <option value="Traditional IRA">Traditional IRA</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Current Balance:</label>
                                <input type="number" id="accountBalance" required step="0.01" min="0" placeholder="0.00"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Annual Contribution:</label>
                                <input type="number" id="accountContribution" step="0.01" min="0" placeholder="0.00"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <small style="color: #666; display: block; margin-top: 3px;">How much you contribute to this account per year</small>
                            </div>

                            <div id="contributionTimingSection" style="display: none; margin-bottom: 10px; padding: 15px; background: #f0f8ff; border-radius: 4px;">
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Contribution lasts for (years):</label>
                                    <input type="number" id="accountContributionYears" min="1" step="1" placeholder="Until retirement"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <small style="color: #666; display: block; margin-top: 3px;">How many years will you keep contributing? Leave blank for indefinite</small>
                                </div>
                            </div>

                            <div id="employerMatchSection" style="display: none; margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Annual Employer Match:</label>
                                <input type="number" id="accountEmployerMatch" step="0.01" min="0" placeholder="0.00"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <small style="color: #666; display: block; margin-top: 3px;">Employer contributions to this account per year</small>
                            </div>

                            <div id="allocationSection" style="margin-bottom: 15px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
                                <label style="display: block; margin-bottom: 10px; font-weight: bold;">Asset Allocation:</label>

                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Stocks %:</label>
                                    <input type="number" id="accountStocks" min="0" max="100" step="1" value="0" placeholder="0"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Bonds %:</label>
                                    <input type="number" id="accountBonds" min="0" max="100" step="1" value="0" placeholder="0"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Cash %:</label>
                                    <input type="number" id="accountCash" min="0" max="100" step="1" value="0" placeholder="0"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>

                                <div id="allocationWarning" style="color: #d9534f; font-size: 0.85em; margin-top: 5px; display: none;">
                                    ⚠ Allocation must total 100%
                                </div>
                            </div>

                            <button type="submit" id="submitAccountBtn"
                                    style="background: #333; color: white; border: none; padding: 10px 20px;
                                           border-radius: 4px; cursor: pointer;">
                                Add Account
                            </button>
                        </form>
                        </div>
                    </div>

                    <div class="section">
                        <h3>Your Accounts</h3>
                        <div id="accountsList"></div>
                    </div>

                    <div class="section" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
                        <h3>Portfolio Summary</h3>
                        <div id="portfolioSummary"></div>
                    </div>

                    <div class="section" style="margin-top: 20px;">
                        <h3>Actions</h3>
                        <button onclick="window.modules['portfolio'].exportData()"
                                style="background: #666; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Export Data
                        </button>
                        <button onclick="window.modules['portfolio'].clearData()"
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
            document.getElementById('toggleAccountFormBtn').addEventListener('click', () => {
                const formContainer = document.getElementById('accountFormContainer');
                const toggleBtn = document.getElementById('toggleAccountFormBtn');

                if (formContainer.style.display === 'none') {
                    formContainer.style.display = 'block';
                    toggleBtn.textContent = '− Hide Form';
                } else {
                    formContainer.style.display = 'none';
                    toggleBtn.textContent = '+ Add Account';
                }
            });

            document.getElementById('addAccountForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addAccount();
            });

            // Handle account type changes to show/hide allocation and employer match
            const accountTypeSelect = document.getElementById('accountType');
            const allocationSection = document.getElementById('allocationSection');
            const employerMatchSection = document.getElementById('employerMatchSection');
            const contributionTimingSection = document.getElementById('contributionTimingSection');
            const contributionInput = document.getElementById('accountContribution');

            const handleAccountTypeChange = () => {
                const accountType = accountTypeSelect.value;

                // Hide allocation for cash-like accounts, alternative assets, and ESOP (company stock)
                if (accountType === 'Savings/Checking' || accountType === 'Crypto' || accountType === 'Gold' || accountType === 'ESOP') {
                    allocationSection.style.display = 'none';
                } else {
                    // Show allocation for investment accounts
                    allocationSection.style.display = 'block';
                }

                // Show employer match field for 401k and 403b accounts
                if (accountType === 'Traditional 401k' || accountType === 'Roth 401k' || accountType === '403b') {
                    employerMatchSection.style.display = 'block';
                } else {
                    employerMatchSection.style.display = 'none';
                }
            };

            // Show contribution timing section when user enters a contribution amount
            const handleContributionChange = () => {
                const contributionAmount = parseFloat(contributionInput.value) || 0;
                if (contributionAmount > 0) {
                    contributionTimingSection.style.display = 'block';
                } else {
                    contributionTimingSection.style.display = 'none';
                }
            };

            accountTypeSelect.addEventListener('change', handleAccountTypeChange);
            contributionInput.addEventListener('input', handleContributionChange);

            // Add real-time validation for allocation percentages
            const stocksInput = document.getElementById('accountStocks');
            const bondsInput = document.getElementById('accountBonds');
            const cashInput = document.getElementById('accountCash');

            const validateAllocation = () => {
                const stocks = parseFloat(stocksInput.value) || 0;
                const bonds = parseFloat(bondsInput.value) || 0;
                const cash = parseFloat(cashInput.value) || 0;
                const total = stocks + bonds + cash;

                const warning = document.getElementById('allocationWarning');
                if (total !== 100 && total !== 0) {
                    warning.style.display = 'block';
                    warning.textContent = `⚠ Allocation totals ${total}% (should be 100%)`;
                } else {
                    warning.style.display = 'none';
                }
            };

            stocksInput.addEventListener('input', validateAllocation);
            bondsInput.addEventListener('input', validateAllocation);
            cashInput.addEventListener('input', validateAllocation);

            // Render accounts list and summary
            this.renderAccountsList();
            this.renderSummary();
        },

        addAccount() {
            const name = document.getElementById('accountName').value;
            const type = document.getElementById('accountType').value;
            const balance = parseFloat(document.getElementById('accountBalance').value);
            const contribution = parseFloat(document.getElementById('accountContribution').value) || 0;
            const contributionYears = document.getElementById('accountContributionYears').value ?
                                      parseInt(document.getElementById('accountContributionYears').value) : null;
            const employerMatch = parseFloat(document.getElementById('accountEmployerMatch').value) || 0;

            // Handle allocation based on account type
            let stocks, bonds, cash;
            if (type === 'Savings/Checking') {
                stocks = 0;
                bonds = 0;
                cash = 100;
            } else if (type === 'Crypto' || type === 'Gold' || type === 'ESOP') {
                // These are separate asset classes, not part of stocks/bonds/cash allocation
                stocks = 0;
                bonds = 0;
                cash = 0;
            } else {
                stocks = parseFloat(document.getElementById('accountStocks').value) || 0;
                bonds = parseFloat(document.getElementById('accountBonds').value) || 0;
                cash = parseFloat(document.getElementById('accountCash').value) || 0;

                // Validate allocation totals 100%
                const allocationTotal = stocks + bonds + cash;
                if (allocationTotal !== 100 && allocationTotal !== 0) {
                    alert(`Asset allocation must total 100% (currently ${allocationTotal}%)`);
                    return;
                }
            }

            if (editingAccountId !== null) {
                // UPDATING existing account
                const account = {
                    id: editingAccountId,
                    name,
                    type,
                    balance,
                    contribution,
                    contributionYears,
                    employerMatch,
                    stocks_pct: stocks,
                    bonds_pct: bonds,
                    cash_pct: cash
                };

                // Replace the account
                accounts = accounts.map(a => a.id === editingAccountId ? account : a);

                // Reset editing state
                editingAccountId = null;
            } else {
                // ADDING new account
                const account = {
                    id: Date.now(),
                    name,
                    type,
                    balance,
                    contribution,
                    contributionYears,
                    employerMatch,
                    stocks_pct: stocks,
                    bonds_pct: bonds,
                    cash_pct: cash
                };

                accounts.push(account);
            }

            this.save();

            // Clear form and reset button
            document.getElementById('addAccountForm').reset();
            document.getElementById('submitAccountBtn').textContent = 'Add Account';
            document.getElementById('allocationWarning').style.display = 'none';

            // Hide the form after adding/updating
            document.getElementById('accountFormContainer').style.display = 'none';
            document.getElementById('toggleAccountFormBtn').textContent = '+ Add Account';

            // Re-render
            this.renderAccountsList();
            this.renderSummary();
        },

        deleteAccount(id) {
            if (confirm('Are you sure you want to delete this account?')) {
                accounts = accounts.filter(a => a.id !== id);
                this.save();
                this.renderAccountsList();
                this.renderSummary();
            }
        },

        editAccount(id) {
            const account = accounts.find(a => a.id === id);
            if (!account) return;

            // Set editing state
            editingAccountId = id;

            // Show the form
            document.getElementById('accountFormContainer').style.display = 'block';
            document.getElementById('toggleAccountFormBtn').textContent = '− Hide Form';

            // Change button text to "Update Account"
            document.getElementById('submitAccountBtn').textContent = 'Update Account';

            // Populate the form with existing account data
            document.getElementById('accountName').value = account.name;
            document.getElementById('accountType').value = account.type;
            document.getElementById('accountBalance').value = account.balance;
            document.getElementById('accountContribution').value = account.contribution || 0;
            document.getElementById('accountContributionYears').value = account.contributionYears || '';
            document.getElementById('accountEmployerMatch').value = account.employerMatch || 0;
            document.getElementById('accountStocks').value = account.stocks_pct || 0;
            document.getElementById('accountBonds').value = account.bonds_pct || 0;
            document.getElementById('accountCash').value = account.cash_pct || 0;

            // Show/hide sections based on account type and contribution
            const allocationSection = document.getElementById('allocationSection');
            const employerMatchSection = document.getElementById('employerMatchSection');
            const contributionTimingSection = document.getElementById('contributionTimingSection');

            if (account.type === 'Savings/Checking' || account.type === 'Crypto' || account.type === 'Gold' || account.type === 'ESOP') {
                allocationSection.style.display = 'none';
            } else {
                allocationSection.style.display = 'block';
            }

            // Show employer match for 401k and 403b accounts
            if (account.type === 'Traditional 401k' || account.type === 'Roth 401k' || account.type === '403b') {
                employerMatchSection.style.display = 'block';
            } else {
                employerMatchSection.style.display = 'none';
            }

            // Show contribution timing if contribution exists
            if ((account.contribution || 0) > 0) {
                contributionTimingSection.style.display = 'block';
            } else {
                contributionTimingSection.style.display = 'none';
            }

            // Scroll to form
            document.getElementById('addAccountForm').scrollIntoView({ behavior: 'smooth' });
        },

        renderAccountsList() {
            const container = document.getElementById('accountsList');

            if (accounts.length === 0) {
                container.innerHTML = '<p style="color: #999;">No accounts added yet.</p>';
                return;
            }

            // Sort accounts by balance (largest to smallest)
            const sortedAccounts = [...accounts].sort((a, b) => b.balance - a.balance);

            container.innerHTML = sortedAccounts.map(account => {
                // Build allocation display (skip for non-traditional assets and ESOP)
                let allocationText = '';

                if (account.type !== 'Savings/Checking' && account.type !== 'Crypto' && account.type !== 'Gold' && account.type !== 'ESOP') {
                    const hasAllocation = account.stocks_pct || account.bonds_pct || account.cash_pct;

                    if (hasAllocation) {
                        const parts = [];
                        if (account.stocks_pct > 0) parts.push(`${account.stocks_pct}% stocks`);
                        if (account.bonds_pct > 0) parts.push(`${account.bonds_pct}% bonds`);
                        if (account.cash_pct > 0) parts.push(`${account.cash_pct}% cash`);
                        allocationText = `<div style="color: #888; font-size: 0.85em; margin-top: 3px;">${parts.join(', ')}</div>`;
                    }
                }

                // Build contribution display
                let contributionText = '';
                const hasContribution = (account.contribution || 0) > 0;
                const hasEmployerMatch = (account.employerMatch || 0) > 0;

                if (hasContribution || hasEmployerMatch) {
                    const parts = [];
                    if (hasContribution) {
                        parts.push(`$${account.contribution.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr contribution`);
                    }
                    if (hasEmployerMatch) {
                        parts.push(`$${account.employerMatch.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr match`);
                    }
                    let contributionLine = parts.join(' + ');

                    // Add duration if specified
                    if (account.contributionYears) {
                        contributionLine += ` for ${account.contributionYears} year${account.contributionYears > 1 ? 's' : ''}`;
                    }

                    contributionText = `<div style="color: #2e7d32; font-size: 0.85em; margin-top: 3px;">${contributionLine}</div>`;
                }

                return `
                    <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <strong>${account.name}</strong>
                                <span style="color: #666; font-size: 0.85em;"> (${account.type})</span>
                                <div style="color: #666; margin-top: 5px; font-size: 1.1em;">
                                    <strong>$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                </div>
                                ${contributionText}
                                ${allocationText}
                            </div>
                            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                                <button onclick="window.modules['portfolio'].editAccount(${account.id})"
                                        style="background: #666; color: white; border: none; padding: 8px 12px;
                                               border-radius: 4px; cursor: pointer;">
                                    Edit
                                </button>
                                <button onclick="window.modules['portfolio'].deleteAccount(${account.id})"
                                        style="background: #ddd; border: none; padding: 8px 12px;
                                               border-radius: 4px; cursor: pointer;">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderSummary() {
            const container = document.getElementById('portfolioSummary');

            // Calculate total portfolio value
            const totalValue = accounts.reduce((sum, account) => sum + account.balance, 0);

            // Calculate total contributions
            const totalContributions = accounts.reduce((sum, account) => sum + (account.contribution || 0), 0);
            const totalEmployerMatch = accounts.reduce((sum, account) => sum + (account.employerMatch || 0), 0);
            const totalSavings = totalContributions + totalEmployerMatch;

            if (totalValue === 0 && totalSavings === 0) {
                container.innerHTML = '<p style="color: #999;">Add accounts to see portfolio summary.</p>';
                return;
            }

            // Calculate allocation across all asset classes
            let totalStocks = 0;
            let totalBonds = 0;
            let totalCash = 0;
            let totalCrypto = 0;
            let totalGold = 0;
            let totalEsop = 0;

            accounts.forEach(account => {
                const accountValue = account.balance;
                const pct = (accountValue / totalValue) * 100;

                if (account.type === 'Crypto') {
                    totalCrypto += pct;
                } else if (account.type === 'Gold') {
                    totalGold += pct;
                } else if (account.type === 'ESOP') {
                    totalEsop += pct;
                } else if (account.type === 'Savings/Checking') {
                    totalCash += pct;
                } else {
                    // For investment accounts, use their allocation
                    const weight = accountValue / totalValue;
                    totalStocks += (account.stocks_pct || 0) * weight;
                    totalBonds += (account.bonds_pct || 0) * weight;
                    totalCash += (account.cash_pct || 0) * weight;
                }
            });

            // Try to get FI Number from Budget module and Income from Income module
            let fiProgressHtml = '';
            let savingsRateHtml = '';

            try {
                if (window.modules['budget'] && window.modules['budget'].getData) {
                    const budgetData = window.modules['budget'].getData();
                    if (budgetData.fiNumber > 0) {
                        const progressPct = (totalValue / budgetData.fiNumber * 100).toFixed(1);
                        const remaining = budgetData.fiNumber - totalValue;
                        const withdrawalRate = budgetData.selectedWithdrawalRate || 4.0;

                        fiProgressHtml = `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                                <div style="margin-bottom: 5px;">
                                    <strong>FI Number:</strong> $${budgetData.fiNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span style="color: #999; font-size: 0.85em;">(${withdrawalRate}% withdrawal rate)</span>
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>Progress to FI:</strong> ${progressPct}%
                                </div>
                                <div style="background: #e0e0e0; height: 24px; border-radius: 4px; overflow: hidden;">
                                    <div style="background: #5cb85c; height: 100%; width: ${Math.min(progressPct, 100)}%;
                                               transition: width 0.3s ease; display: flex; align-items: center;
                                               justify-content: center; color: white; font-size: 0.85em;">
                                        ${progressPct >= 10 ? progressPct + '%' : ''}
                                    </div>
                                </div>
                                <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                                    $${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining to FI
                                </div>
                            </div>
                        `;
                    }
                }
            } catch (e) {
                // Budget module not available or not initialized yet
                console.log('Budget module not available for FI calculation');
            }

            // Calculate savings rate if Income module is available
            // Savings rate = (employee contributions + leftover cash) / gross income
            // Add contributions back to income since take-home already has 401k/IRA deducted
            try {
                if (window.modules['income'] && window.modules['income'].getData) {
                    const incomeData = window.modules['income'].getData();
                    if (incomeData.annualTotal > 0) {
                        // Calculate leftover cash (take-home minus expenses)
                        const budgetData = window.modules['budget']?.getData();
                        const leftoverCash = incomeData.annualTotal - (budgetData?.annualTotal || 0);

                        // Total saved = contributions + leftover cash (if positive)
                        const totalSaved = totalContributions + Math.max(0, leftoverCash);

                        // Gross income = take-home + pre-tax contributions
                        const grossIncome = incomeData.annualTotal + totalContributions;

                        if (totalSaved > 0) {
                            const savingsRate = (totalSaved / grossIncome * 100).toFixed(1);
                            savingsRateHtml = `
                                <div style="margin-top: 5px;">
                                    <strong>Savings Rate:</strong> ${savingsRate}% of gross income
                                </div>
                                <div style="margin-top: 3px; color: #666; font-size: 0.9em;">
                                    ($${totalContributions.toLocaleString()} contributions + $${Math.max(0, leftoverCash).toLocaleString()} leftover cash)
                                </div>
                            `;
                        }
                    }
                }
            } catch (e) {
                // Income or Budget module not available
                console.log('Income/Budget module not available for savings rate calculation');
            }

            // Build contributions section
            let contributionsHtml = '';
            if (totalSavings > 0) {
                contributionsHtml = `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <strong>Annual Savings:</strong>
                        <div style="margin-top: 8px;">
                            ${totalContributions > 0 ? `<div style="margin-bottom: 5px;">Employee Contributions: $${totalContributions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>` : ''}
                            ${totalEmployerMatch > 0 ? `<div style="margin-bottom: 5px;">Employer Match: $${totalEmployerMatch.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>` : ''}
                            <div style="margin-top: 8px; font-size: 1.05em;">
                                <strong>Total: $${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/year</strong>
                            </div>
                            ${savingsRateHtml}
                        </div>
                    </div>
                `;
            }

            // Build allocation display - only show asset classes with value > 0
            let allocationLines = [];
            if (totalStocks > 0) allocationLines.push(`<div style="margin-bottom: 5px;">Stocks: ${totalStocks.toFixed(1)}%</div>`);
            if (totalBonds > 0) allocationLines.push(`<div style="margin-bottom: 5px;">Bonds: ${totalBonds.toFixed(1)}%</div>`);
            if (totalCash > 0) allocationLines.push(`<div style="margin-bottom: 5px;">Cash: ${totalCash.toFixed(1)}%</div>`);
            if (totalEsop > 0) allocationLines.push(`<div style="margin-bottom: 5px;">ESOP: ${totalEsop.toFixed(1)}%</div>`);
            if (totalCrypto > 0) allocationLines.push(`<div style="margin-bottom: 5px;">Crypto: ${totalCrypto.toFixed(1)}%</div>`);
            if (totalGold > 0) allocationLines.push(`<div style="margin-bottom: 5px;">Gold: ${totalGold.toFixed(1)}%</div>`);

            const allocationHtml = allocationLines.length > 0
                ? allocationLines.join('')
                : '<div style="color: #999;">No allocation data</div>';

            container.innerHTML = `
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <div style="margin-bottom: 10px; font-size: 1.2em;">
                        <strong>Total Portfolio Value:</strong> $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Number of Accounts:</strong> ${accounts.length}
                    </div>
                    ${contributionsHtml}
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <strong>Overall Asset Allocation:</strong>
                        <div style="margin-top: 8px;">
                            ${allocationHtml}
                        </div>
                    </div>
                    ${fiProgressHtml}
                </div>
            `;
        },

        save() {
            StateManager.save('portfolio', { accounts });
        },

        exportData() {
            const data = { accounts };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        clearData() {
            if (confirm('Are you sure you want to clear all portfolio data? This cannot be undone.')) {
                accounts = [];
                editingAccountId = null;
                this.save();
                this.renderAccountsList();
                this.renderSummary();
            }
        },

        // Public API for other modules to access portfolio data
        getData() {
            const totalValue = accounts.reduce((sum, account) => sum + account.balance, 0);

            // Calculate total contributions
            const totalContributions = accounts.reduce((sum, account) => sum + (account.contribution || 0), 0);
            const totalEmployerMatch = accounts.reduce((sum, account) => sum + (account.employerMatch || 0), 0);
            const totalSavings = totalContributions + totalEmployerMatch;

            // Calculate allocation across all asset classes
            let totalStocks = 0;
            let totalBonds = 0;
            let totalCash = 0;
            let totalCrypto = 0;
            let totalGold = 0;
            let totalEsop = 0;

            if (totalValue > 0) {
                accounts.forEach(account => {
                    const accountValue = account.balance;
                    const pct = (accountValue / totalValue) * 100;

                    if (account.type === 'Crypto') {
                        totalCrypto += pct;
                    } else if (account.type === 'Gold') {
                        totalGold += pct;
                    } else if (account.type === 'ESOP') {
                        totalEsop += pct;
                    } else if (account.type === 'Savings/Checking') {
                        totalCash += pct;
                    } else {
                        // For investment accounts, use their allocation
                        const weight = accountValue / totalValue;
                        totalStocks += (account.stocks_pct || 0) * weight;
                        totalBonds += (account.bonds_pct || 0) * weight;
                        totalCash += (account.cash_pct || 0) * weight;
                    }
                });
            }

            return {
                accounts,
                totalValue,
                totalContributions,
                totalEmployerMatch,
                totalSavings,
                allocation: {
                    stocks: totalStocks,
                    bonds: totalBonds,
                    cash: totalCash,
                    esop: totalEsop,
                    crypto: totalCrypto,
                    gold: totalGold
                }
            };
        }
    };
})();
