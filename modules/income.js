// Income Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }

    // Income module state
    let incomeSources = [];
    let editingIncomeId = null; // Track if we're editing an income source

    // Module definition
    window.modules['income'] = {
        init() {
            // Load saved income sources
            const savedData = StateManager.load('income');
            if (savedData && savedData.incomeSources) {
                incomeSources = savedData.incomeSources;
            }

            // Render the module UI
            this.render();
        },

        render() {
            const container = document.getElementById('modalBody');

            container.innerHTML = `
                <div class="income-module">
                    <div class="section">
                        <h3>Add Income Source</h3>
                        <form id="addIncomeForm" style="margin-bottom: 20px;">
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Name:</label>
                                <input type="text" id="incomeName" required
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Type:</label>
                                <select id="incomeType"
                                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="wages">Wages/Salary</option>
                                    <option value="social-security">Social Security</option>
                                    <option value="pension">Pension</option>
                                    <option value="rental">Rental Income</option>
                                    <option value="dividends">Dividends</option>
                                    <option value="interest">Interest</option>
                                    <option value="business">Business Income</option>
                                    <option value="part-time">Part-time Work</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Amount:</label>
                                <input type="number" id="incomeAmount" required step="0.01" min="0"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>

                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Frequency:</label>
                                <select id="incomeFrequency"
                                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="monthly">Monthly</option>
                                    <option value="annual">Annual</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 10px;">
                                <a href="#" id="toggleAdvanced" style="color: #666; text-decoration: none; font-size: 0.9em;">
                                    ▶ Advanced Options
                                </a>
                            </div>

                            <div id="advancedOptions" style="display: none; padding: 15px; background: #f9f9f9; border-radius: 4px; margin-bottom: 10px;">
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Starts in (years):</label>
                                    <input type="number" id="incomeStartsIn" min="0" step="1" placeholder="0 = now"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <small style="color: #666;">Leave blank or 0 for income that starts now</small>
                                </div>

                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Lasts for (years):</label>
                                    <input type="number" id="incomeLastsFor" min="1" step="1" placeholder="Permanent"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <small style="color: #666;">Leave blank for permanent income</small>
                                </div>
                            </div>

                            <button type="submit" id="submitIncomeBtn"
                                    style="background: #333; color: white; border: none; padding: 10px 20px;
                                           border-radius: 4px; cursor: pointer;">
                                Add Income
                            </button>
                        </form>
                    </div>

                    <div class="section">
                        <h3>Your Income Sources</h3>
                        <div id="incomeList"></div>
                    </div>

                    <div class="section" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
                        <h3>Summary</h3>
                        <div id="incomeSummary"></div>
                    </div>

                    <div class="section" style="margin-top: 20px;">
                        <h3>Actions</h3>
                        <button onclick="window.modules['income'].exportData()"
                                style="background: #666; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Export Data
                        </button>
                        <button onclick="window.modules['income'].clearData()"
                                style="background: #999; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer;">
                            Clear All
                        </button>
                    </div>
                </div>
            `;

            // Attach event listeners
            document.getElementById('addIncomeForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addIncome();
            });

            // Toggle advanced options
            document.getElementById('toggleAdvanced').addEventListener('click', (e) => {
                e.preventDefault();
                const advancedDiv = document.getElementById('advancedOptions');
                const toggleLink = document.getElementById('toggleAdvanced');

                if (advancedDiv.style.display === 'none') {
                    advancedDiv.style.display = 'block';
                    toggleLink.innerHTML = '▼ Advanced Options';
                } else {
                    advancedDiv.style.display = 'none';
                    toggleLink.innerHTML = '▶ Advanced Options';
                }
            });

            // Render income list and summary
            this.renderIncomeList();
            this.renderSummary();
        },

        addIncome() {
            const name = document.getElementById('incomeName').value;
            const type = document.getElementById('incomeType').value;
            const amount = parseFloat(document.getElementById('incomeAmount').value);
            const frequency = document.getElementById('incomeFrequency').value;

            // Get advanced options
            const startsInValue = document.getElementById('incomeStartsIn').value;
            const lastsForValue = document.getElementById('incomeLastsFor').value;

            const startsIn = startsInValue ? parseInt(startsInValue) : 0;
            const lastsFor = lastsForValue ? parseInt(lastsForValue) : null; // null = permanent

            if (editingIncomeId !== null) {
                // UPDATING existing income source
                const income = {
                    id: editingIncomeId,
                    name,
                    type,
                    amount,
                    frequency,
                    startsIn,
                    lastsFor
                };

                // Replace the income source
                incomeSources = incomeSources.map(i => i.id === editingIncomeId ? income : i);

                // Reset editing state
                editingIncomeId = null;
            } else {
                // ADDING new income source
                const income = {
                    id: Date.now(),
                    name,
                    type,
                    amount,
                    frequency,
                    startsIn,
                    lastsFor
                };

                incomeSources.push(income);
            }

            this.save();

            // Clear form and reset button
            document.getElementById('addIncomeForm').reset();
            document.getElementById('submitIncomeBtn').textContent = 'Add Income';

            // Hide advanced options and reset toggle
            document.getElementById('advancedOptions').style.display = 'none';
            document.getElementById('toggleAdvanced').innerHTML = '▶ Advanced Options';

            // Re-render
            this.renderIncomeList();
            this.renderSummary();
        },

        deleteIncome(id) {
            incomeSources = incomeSources.filter(i => i.id !== id);
            this.save();
            this.renderIncomeList();
            this.renderSummary();
        },

        editIncome(id) {
            const income = incomeSources.find(i => i.id === id);
            if (!income) return;

            // Set editing state
            editingIncomeId = id;

            // Change button text to "Update Income"
            document.getElementById('submitIncomeBtn').textContent = 'Update Income';

            // Populate the form with existing income data
            document.getElementById('incomeName').value = income.name;
            document.getElementById('incomeType').value = income.type;
            document.getElementById('incomeAmount').value = income.amount;
            document.getElementById('incomeFrequency').value = income.frequency;

            // Show advanced options if needed
            if (income.startsIn > 0 || income.lastsFor !== null) {
                document.getElementById('advancedOptions').style.display = 'block';
                document.getElementById('toggleAdvanced').innerHTML = '▼ Advanced Options';

                document.getElementById('incomeStartsIn').value = income.startsIn || '';
                document.getElementById('incomeLastsFor').value = income.lastsFor || '';
            }

            // Scroll to form
            document.getElementById('addIncomeForm').scrollIntoView({ behavior: 'smooth' });
        },

        getTypeLabel(type) {
            const labels = {
                'wages': 'Wages/Salary',
                'social-security': 'Social Security',
                'pension': 'Pension',
                'rental': 'Rental Income',
                'dividends': 'Dividends',
                'interest': 'Interest',
                'business': 'Business Income',
                'part-time': 'Part-time Work',
                'other': 'Other'
            };
            return labels[type] || type;
        },

        renderIncomeList() {
            const container = document.getElementById('incomeList');

            if (incomeSources.length === 0) {
                container.innerHTML = '<p style="color: #999;">No income sources added yet.</p>';
                return;
            }

            // Sort income sources by annual amount (largest to smallest)
            const sortedIncome = [...incomeSources].sort((a, b) => {
                const aAnnual = a.frequency === 'monthly' ? a.amount * 12 : a.amount;
                const bAnnual = b.frequency === 'monthly' ? b.amount * 12 : b.amount;
                return bAnnual - aAnnual;
            });

            container.innerHTML = sortedIncome.map(income => {
                const annualAmount = income.frequency === 'monthly' ? income.amount * 12 : income.amount;

                // Build timing description
                let timingText = '';
                if (income.startsIn > 0 || income.lastsFor !== null) {
                    const parts = [];
                    if (income.startsIn > 0) {
                        parts.push(`starts in ${income.startsIn} year${income.startsIn > 1 ? 's' : ''}`);
                    }
                    if (income.lastsFor !== null) {
                        parts.push(`lasts ${income.lastsFor} year${income.lastsFor > 1 ? 's' : ''}`);
                    }
                    timingText = `<div style="color: #888; font-size: 0.85em; margin-top: 3px;">${parts.join(', ')}</div>`;
                }

                return `
                    <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <strong>${income.name}</strong>
                                <span style="color: #666; font-size: 0.85em;"> (${this.getTypeLabel(income.type)})</span>
                                <div style="color: #666; margin-top: 5px;">
                                    $${income.amount.toFixed(2)} ${income.frequency} ($${annualAmount.toFixed(2)}/year)
                                </div>
                                ${timingText}
                            </div>
                            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                                <button onclick="window.modules['income'].editIncome(${income.id})"
                                        style="background: #666; color: white; border: none; padding: 8px 12px;
                                               border-radius: 4px; cursor: pointer;">
                                    Edit
                                </button>
                                <button onclick="window.modules['income'].deleteIncome(${income.id})"
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
            const container = document.getElementById('incomeSummary');

            const annualTotal = incomeSources.reduce((sum, income) => {
                const annual = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
                return sum + annual;
            }, 0);

            // Calculate totals by type
            const byType = {};
            incomeSources.forEach(income => {
                const annual = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
                if (!byType[income.type]) {
                    byType[income.type] = 0;
                }
                byType[income.type] += annual;
            });

            let breakdownHtml = '';
            if (Object.keys(byType).length > 0) {
                breakdownHtml = '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">';
                breakdownHtml += '<strong>By Type:</strong>';
                for (const [type, amount] of Object.entries(byType)) {
                    breakdownHtml += `<div style="margin-top: 5px; color: #666;">${this.getTypeLabel(type)}: $${amount.toFixed(2)}</div>`;
                }
                breakdownHtml += '</div>';
            }

            container.innerHTML = `
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <div style="margin-bottom: 10px; font-size: 1.1em;">
                        <strong>Total Annual Income:</strong> $${annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style="color: #666;">
                        <strong>Monthly Average:</strong> $${(annualTotal / 12).toFixed(2)}
                    </div>
                    ${breakdownHtml}
                </div>
            `;
        },

        save() {
            StateManager.save('income', { incomeSources });
        },

        exportData() {
            const data = { incomeSources };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `income-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        clearData() {
            if (confirm('Are you sure you want to clear all income data? This cannot be undone.')) {
                incomeSources = [];
                this.save();
                this.renderIncomeList();
                this.renderSummary();
            }
        },

        // Public API for other modules to access income data
        getData() {
            const annualTotal = incomeSources.reduce((sum, income) => {
                const annual = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
                return sum + annual;
            }, 0);

            // Calculate by type
            const byType = {};
            incomeSources.forEach(income => {
                const annual = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
                if (!byType[income.type]) {
                    byType[income.type] = 0;
                }
                byType[income.type] += annual;
            });

            return {
                incomeSources,
                annualTotal,
                monthlyAverage: annualTotal / 12,
                byType
            };
        }
    };
})();
