// Budget Builder Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }
    
    // Budget module state
    let expenses = [];
    let editingExpenseId = null; // Track if we're editing an expense
    
    // Module definition
    window.modules['budget'] = {
        init() {
            // Load saved expenses
            const savedData = StateManager.load('budget');
            if (savedData && savedData.expenses) {
                expenses = savedData.expenses;
            }
            
            // Check if we need to add Healthcare expense
            const hasHealthcare = expenses.some(e => e.isHealthcare);
            if (!hasHealthcare) {
                // Pre-populate with Healthcare expense
                expenses.push({
                    id: Date.now(),
                    name: 'Healthcare',
                    amount: 0,
                    frequency: 'monthly',
                    essential: true,
                    startsIn: 0,
                    lastsFor: null,
                    isHealthcare: true
                });
                this.save();
            }
            
            // Render the module UI
            this.render();
        },
        
        render() {
            const container = document.getElementById('modalBody');
            
            container.innerHTML = `
                <div class="budget-module">
                    <div class="section">
                        <button id="toggleExpenseFormBtn"
                                style="background: #333; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-bottom: 15px;">
                            + Add Expense
                        </button>
                        <div id="expenseFormContainer" style="display: none;">
                            <h3>Add Expense</h3>
                            <form id="addExpenseForm" style="margin-bottom: 20px;">
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Name:</label>
                                <input type="text" id="expenseName" required 
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Amount:</label>
                                <input type="number" id="expenseAmount" required step="0.01" min="0"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Frequency:</label>
                                <select id="expenseFrequency" 
                                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="monthly">Monthly</option>
                                    <option value="annual">Annual</option>
                                </select>
                            </div>
                            
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">
                                    <input type="checkbox" id="expenseEssential"> Essential expense
                                </label>
                            </div>
                            
                            <div style="margin-bottom: 10px;">
                                <a href="#" id="toggleAdvanced" style="color: #666; text-decoration: none; font-size: 0.9em;">
                                    ▶ Advanced Options
                                </a>
                            </div>
                            
                            <div id="advancedOptions" style="display: none; padding: 15px; background: #f9f9f9; border-radius: 4px; margin-bottom: 10px;">
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Starts in (years):</label>
                                    <input type="number" id="expenseStartsIn" min="0" step="1" placeholder="0 = now"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <small style="color: #666;">Leave blank or 0 for expenses that start now</small>
                                </div>
                                
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px;">Lasts for (years):</label>
                                    <input type="number" id="expenseLastsFor" min="1" step="1" placeholder="Permanent"
                                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <small style="color: #666;">Leave blank for permanent expenses</small>
                                </div>
                            </div>
                            
                            <button type="submit" id="submitExpenseBtn"
                                    style="background: #333; color: white; border: none; padding: 10px 20px;
                                           border-radius: 4px; cursor: pointer;">
                                Add Expense
                            </button>
                        </form>
                        </div>
                    </div>

                    <div class="section">
                        <h3>Your Expenses</h3>
                        <div id="expensesList"></div>
                    </div>
                    
                    <div class="section" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
                        <h3>Summary</h3>
                        <div id="expensesSummary"></div>
                    </div>
                    
                    <div class="section" style="margin-top: 20px;">
                        <h3>Actions</h3>
                        <button onclick="window.modules['budget'].exportData()"
                                style="background: #666; color: white; border: none; padding: 10px 20px; 
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Export Data
                        </button>
                        <button onclick="window.modules['budget'].clearData()"
                                style="background: #999; color: white; border: none; padding: 10px 20px; 
                                       border-radius: 4px; cursor: pointer;">
                            Clear All
                        </button>
                    </div>
                </div>
            `;
            
            // Attach event listeners
            document.getElementById('toggleExpenseFormBtn').addEventListener('click', () => {
                const formContainer = document.getElementById('expenseFormContainer');
                const toggleBtn = document.getElementById('toggleExpenseFormBtn');

                if (formContainer.style.display === 'none') {
                    formContainer.style.display = 'block';
                    toggleBtn.textContent = '− Hide Form';
                } else {
                    formContainer.style.display = 'none';
                    toggleBtn.textContent = '+ Add Expense';
                }
            });

            document.getElementById('addExpenseForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addExpense();
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
            
            // Render expenses list and summary
            this.renderExpensesList();
            this.renderSummary();
        },
        
        addExpense() {
            const name = document.getElementById('expenseName').value;
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const frequency = document.getElementById('expenseFrequency').value;
            const essential = document.getElementById('expenseEssential').checked;
            
            // Get advanced options
            const startsInValue = document.getElementById('expenseStartsIn').value;
            const lastsForValue = document.getElementById('expenseLastsFor').value;
            
            const startsIn = startsInValue ? parseInt(startsInValue) : 0;
            const lastsFor = lastsForValue ? parseInt(lastsForValue) : null; // null = permanent
            
            if (editingExpenseId !== null) {
                // UPDATING existing expense
                const existingExpense = expenses.find(e => e.id === editingExpenseId);
                const expense = {
                    id: editingExpenseId,
                    name,
                    amount,
                    frequency,
                    essential,
                    startsIn,
                    lastsFor,
                    isHealthcare: existingExpense?.isHealthcare || false // Preserve isHealthcare flag
                };
                
                // Replace the expense
                expenses = expenses.map(e => e.id === editingExpenseId ? expense : e);
                
                // Reset editing state
                editingExpenseId = null;
            } else {
                // ADDING new expense
                const expense = {
                    id: Date.now(),
                    name,
                    amount,
                    frequency,
                    essential,
                    startsIn,
                    lastsFor
                };
                
                expenses.push(expense);
            }
            
            this.save();

            // Clear form and reset button
            document.getElementById('addExpenseForm').reset();
            document.getElementById('submitExpenseBtn').textContent = 'Add Expense';

            // Hide advanced options and reset toggle
            document.getElementById('advancedOptions').style.display = 'none';
            document.getElementById('toggleAdvanced').innerHTML = '▶ Advanced Options';

            // Hide the form after adding/updating
            document.getElementById('expenseFormContainer').style.display = 'none';
            document.getElementById('toggleExpenseFormBtn').textContent = '+ Add Expense';

            // Re-render
            this.renderExpensesList();
            this.renderSummary();
        },
        
        deleteExpense(id) {
            expenses = expenses.filter(e => e.id !== id);
            this.save();
            this.renderExpensesList();
            this.renderSummary();
        },
        
        editExpense(id) {
            const expense = expenses.find(e => e.id === id);
            if (!expense) return;

            // Set editing state
            editingExpenseId = id;

            // Show the form
            document.getElementById('expenseFormContainer').style.display = 'block';
            document.getElementById('toggleExpenseFormBtn').textContent = '− Hide Form';

            // Change button text to "Update Expense"
            document.getElementById('submitExpenseBtn').textContent = 'Update Expense';
            
            // Populate the form with existing expense data
            document.getElementById('expenseName').value = expense.name;
            document.getElementById('expenseAmount').value = expense.amount;
            document.getElementById('expenseFrequency').value = expense.frequency;
            document.getElementById('expenseEssential').checked = expense.essential;
            
            // Show advanced options if needed
            if (expense.startsIn > 0 || expense.lastsFor !== null) {
                document.getElementById('advancedOptions').style.display = 'block';
                document.getElementById('toggleAdvanced').innerHTML = '▼ Advanced Options';
                
                document.getElementById('expenseStartsIn').value = expense.startsIn || '';
                document.getElementById('expenseLastsFor').value = expense.lastsFor || '';
            }
            
            // Scroll to form
            document.getElementById('addExpenseForm').scrollIntoView({ behavior: 'smooth' });
        },
        
        renderExpensesList() {
            const container = document.getElementById('expensesList');
            
            if (expenses.length === 0) {
                container.innerHTML = '<p style="color: #999;">No expenses added yet.</p>';
                return;
            }
            
            // Sort expenses by annual amount (largest to smallest)
            const sortedExpenses = [...expenses].sort((a, b) => {
                const aAnnual = a.frequency === 'monthly' ? a.amount * 12 : a.amount;
                const bAnnual = b.frequency === 'monthly' ? b.amount * 12 : b.amount;
                return bAnnual - aAnnual;
            });
            
            container.innerHTML = sortedExpenses.map(expense => {
                const annualAmount = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
                
                // Build timing description
                let timingText = '';
                if (expense.startsIn > 0 || expense.lastsFor !== null) {
                    const parts = [];
                    if (expense.startsIn > 0) {
                        parts.push(`starts in ${expense.startsIn} year${expense.startsIn > 1 ? 's' : ''}`);
                    }
                    if (expense.lastsFor !== null) {
                        parts.push(`lasts ${expense.lastsFor} year${expense.lastsFor > 1 ? 's' : ''}`);
                    }
                    timingText = `<div style="color: #888; font-size: 0.85em; margin-top: 3px;">${parts.join(', ')}</div>`;
                }
                
                // Special handling for Healthcare expense
                let acaLink = '';
                if (expense.isHealthcare) {
                    acaLink = `
                        <div style="margin-top: 8px;">
                            <button onclick="alert('ACA Calculator integration coming soon!')" 
                                    style="background: #666; color: white; border: none; padding: 6px 12px; 
                                           border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                                Calculate with ACA Tool →
                            </button>
                        </div>
                    `;
                }
                
                return `
                    <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <strong>${expense.name}</strong>
                                ${expense.essential ? '<span style="color: #666; font-size: 0.85em;"> (Essential)</span>' : ''}
                                <div style="color: #666; margin-top: 5px;">
                                    $${expense.amount.toFixed(2)} ${expense.frequency} ($${annualAmount.toFixed(2)}/year)
                                </div>
                                ${timingText}
                                ${acaLink}
                            </div>
                            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                                <button onclick="window.modules['budget'].editExpense(${expense.id})"
                                        style="background: #666; color: white; border: none; padding: 8px 12px; 
                                               border-radius: 4px; cursor: pointer;">
                                    Edit
                                </button>
                                <button onclick="window.modules['budget'].deleteExpense(${expense.id})"
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
            const container = document.getElementById('expensesSummary');
            
            const annualTotal = expenses.reduce((sum, expense) => {
                const annual = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
                return sum + annual;
            }, 0);
            
            const essentialTotal = expenses
                .filter(e => e.essential)
                .reduce((sum, expense) => {
                    const annual = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
                    return sum + annual;
                }, 0);
            
            const fiNumber = annualTotal * 25;
            
            container.innerHTML = `
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <div style="margin-bottom: 10px;">
                        <strong>Annual Expenses:</strong> $${annualTotal.toFixed(2)}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Essential Expenses:</strong> $${essentialTotal.toFixed(2)}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Discretionary Expenses:</strong> $${(annualTotal - essentialTotal).toFixed(2)}
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <strong>FI Number (25x):</strong> $${fiNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            `;
        },
        
        save() {
            StateManager.save('budget', { expenses });
        },
        
        exportData() {
            const data = { expenses };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        clearData() {
            if (confirm('Are you sure you want to clear all budget data? This cannot be undone.')) {
                expenses = [];
                this.save();
                this.renderExpensesList();
                this.renderSummary();
            }
        },
        
        // Public API for other modules to access budget data
        getData() {
            const annualTotal = expenses.reduce((sum, expense) => {
                const annual = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
                return sum + annual;
            }, 0);
            
            const essentialTotal = expenses
                .filter(e => e.essential)
                .reduce((sum, expense) => {
                    const annual = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
                    return sum + annual;
                }, 0);
            
            return {
                expenses,
                annualTotal,
                essentialTotal,
                discretionaryTotal: annualTotal - essentialTotal,
                fiNumber: annualTotal * 25
            };
        }
    };
})();
