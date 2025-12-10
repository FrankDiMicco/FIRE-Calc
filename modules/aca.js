// ACA Subsidy Calculator Module
(function() {
    // Initialize modules namespace if it doesn't exist
    if (!window.modules) {
        window.modules = {};
    }
    
    // ACA module state
    let householdData = {
        zipcode: '',
        state: '',
        county: '',
        year: 2024, // Use 2024 for more complete data
        income: 0,
        members: []
    };

    let lastResults = null; // Store last calculation results
    let selectedPlanTier = null; // Track which plan tier is currently in Budget

    let apiKey = ''; // User will add their CMS API key here
    
    // Module definition
    window.modules['aca'] = {
        init() {
            // Load saved data
            const savedData = StateManager.load('aca');
            if (savedData) {
                householdData = savedData.householdData || householdData;
                lastResults = savedData.lastResults || null;
                selectedPlanTier = savedData.selectedPlanTier || null;
                apiKey = savedData.apiKey || '';
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
                <div class="aca-module">
                    <div class="section">
                        <h3>API Configuration</h3>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                                CMS Marketplace API Key:
                            </label>
                            <input type="text" id="apiKey" value="${apiKey}" placeholder="Enter your CMS API key"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 5px;">
                            <small style="color: #666;">
                                Get your free API key at: 
                                <a href="https://developer.cms.gov/marketplace-api/key-request.html" target="_blank">
                                    CMS Developer Portal
                                </a>
                            </small>
                            <div style="margin-top: 10px;">
                                <button onclick="window.modules['aca'].saveApiKey()" 
                                        style="background: #666; color: white; border: none; padding: 8px 16px; 
                                               border-radius: 4px; cursor: pointer;">
                                    Save API Key
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>Household Information</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">ZIP Code:</label>
                            <input type="text" id="zipcode" value="${householdData.zipcode}" 
                                   placeholder="e.g., 33428"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Annual Household Income (MAGI):</label>
                            <input type="number" id="income" value="${householdData.income || ''}" 
                                   placeholder="e.g., 50000" min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <small style="color: #666;">Modified Adjusted Gross Income</small>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Coverage Year:</label>
                            <input type="number" id="year" value="${householdData.year}" 
                                   min="2014" max="2030"
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>Household Members</h3>
                        <div id="membersList"></div>
                        
                        <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
                            <h4 style="margin-bottom: 10px;">Add Member</h4>
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">Age:</label>
                                <input type="number" id="memberAge" min="0" max="120" placeholder="e.g., 35"
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px;">
                                    <input type="checkbox" id="memberTobacco"> Uses tobacco
                                </label>
                            </div>
                            <button onclick="window.modules['aca'].addMember()" 
                                    style="background: #666; color: white; border: none; padding: 8px 16px; 
                                           border-radius: 4px; cursor: pointer;">
                                Add Member
                            </button>
                        </div>
                    </div>
                    
                    <div class="section" style="margin-top: 20px;">
                        <button onclick="window.modules['aca'].calculateSubsidy()" 
                                style="background: #333; color: white; border: none; padding: 12px 24px; 
                                       border-radius: 4px; cursor: pointer; font-size: 1.1em;">
                            Calculate ACA Subsidy
                        </button>
                    </div>
                    
                    <div id="results" style="margin-top: 20px;"></div>
                    
                    <div class="section" style="margin-top: 20px;">
                        <h3>Actions</h3>
                        <button onclick="window.modules['aca'].exportData()"
                                style="background: #666; color: white; border: none; padding: 10px 20px;
                                       border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Export Data
                        </button>
                        <button onclick="window.modules['aca'].clearData()"
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
            
            this.renderMembersList();
        },
        
        renderMembersList() {
            const container = document.getElementById('membersList');
            
            if (householdData.members.length === 0) {
                container.innerHTML = '<p style="color: #999;">No members added yet.</p>';
                return;
            }
            
            container.innerHTML = householdData.members.map((member, index) => `
                <div style="padding: 12px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px; 
                            display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Member ${index + 1}</strong> - Age: ${member.age}
                        ${member.uses_tobacco ? ' (Tobacco user)' : ''}
                    </div>
                    <button onclick="window.modules['aca'].removeMember(${index})"
                            style="background: #ddd; border: none; padding: 6px 12px; 
                                   border-radius: 4px; cursor: pointer;">
                        Remove
                    </button>
                </div>
            `).join('');
        },
        
        saveApiKey() {
            apiKey = document.getElementById('apiKey').value.trim();
            this.save();
            alert('API key saved!');
        },
        
        addMember() {
            const age = parseInt(document.getElementById('memberAge').value);
            const usesTobacco = document.getElementById('memberTobacco').checked;
            
            if (!age || age < 0 || age > 120) {
                alert('Please enter a valid age (0-120)');
                return;
            }
            
            householdData.members.push({
                age: age,
                uses_tobacco: usesTobacco,
                dob: this.calculateDOB(age)
            });
            
            // Clear form
            document.getElementById('memberAge').value = '';
            document.getElementById('memberTobacco').checked = false;
            
            this.save();
            this.renderMembersList();
        },
        
        removeMember(index) {
            householdData.members.splice(index, 1);
            this.save();
            this.renderMembersList();
        },
        
        calculateDOB(age) {
            const currentYear = householdData.year;
            const birthYear = currentYear - age;
            // Use July 1st as a middle-of-year birthday for better accuracy
            return `${birthYear}-07-01`;
        },
        
        async calculateSubsidy() {
            // Validate API key
            if (!apiKey) {
                alert('Please add your CMS Marketplace API key first.');
                return;
            }
            
            // Get form values
            householdData.zipcode = document.getElementById('zipcode').value;
            householdData.income = parseFloat(document.getElementById('income').value);
            householdData.year = parseInt(document.getElementById('year').value);
            
            // Validate inputs
            if (!householdData.zipcode || !householdData.income) {
                alert('Please fill in ZIP code and income.');
                return;
            }
            
            if (householdData.members.length === 0) {
                alert('Please add at least one household member.');
                return;
            }
            
            this.save();
            
            // Show loading
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<p>Calculating subsidy...</p>';
            
            try {
                // Call CMS Marketplace API
                const result = await this.callCMSApi();
                lastResults = result; // Save results
                this.save(); // Persist to localStorage
                this.displayResults(result);
            } catch (error) {
                resultsDiv.innerHTML = `
                    <div style="background: #fee; padding: 15px; border-radius: 4px; border: 1px solid #c00;">
                        <strong>Error:</strong> ${error.message}
                        <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                            Make sure your API key is valid and you have an internet connection.
                        </div>
                    </div>
                `;
            }
        },
        
        async callCMSApi() {
            // First, get county/state from ZIP code
            const locationUrl = `https://marketplace.api.healthcare.gov/api/v1/counties/by/zip/${householdData.zipcode}?apikey=${apiKey}`;
            
            console.log('Fetching location for ZIP:', householdData.zipcode);
            const locationResponse = await fetch(locationUrl);
            if (!locationResponse.ok) {
                throw new Error('Failed to lookup ZIP code. Check your ZIP and API key.');
            }
            
            const locationData = await locationResponse.json();
            console.log('Location data:', locationData);
            
            if (!locationData.counties || locationData.counties.length === 0) {
                throw new Error('No counties found for that ZIP code.');
            }
            
            // Use first county
            const county = locationData.counties[0];
            householdData.state = county.state;
            householdData.county = county.fips;
            
            console.log('Using county:', county);
            
            // Build household array for API
            const household = {
                income: householdData.income,
                people: householdData.members.map((member, index) => ({
                    age: member.age,
                    dob: member.dob,
                    uses_tobacco: member.uses_tobacco
                }))
            };
            
            const baseRequestBody = {
                household: household,
                market: 'Individual',
                place: {
                    countyfips: householdData.county,
                    state: householdData.state,
                    zipcode: householdData.zipcode
                },
                year: householdData.year
            };
            
            console.log('Base request body:', JSON.stringify(baseRequestBody, null, 2));
            
            // First, make call to eligibility endpoint to get proper APTC calculation
            const eligibilityUrl = `https://marketplace.api.healthcare.gov/api/v1/households/eligibility/estimates?apikey=${apiKey}`;
            
            let aptcAmount = 0;
            
            try {
                const eligibilityResponse = await fetch(eligibilityUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        household: household,
                        place: {
                            countyfips: householdData.county,
                            state: householdData.state,
                            zipcode: householdData.zipcode
                        },
                        year: householdData.year
                    })
                });
                
                if (eligibilityResponse.ok) {
                    const eligibilityData = await eligibilityResponse.json();
                    console.log('Eligibility data:', eligibilityData);
                    
                    // APTC is for the household, use first estimate
                    if (eligibilityData.estimates && eligibilityData.estimates.length > 0) {
                        aptcAmount = eligibilityData.estimates[0].aptc || 0;
                        console.log('Household APTC from eligibility endpoint:', aptcAmount);
                        console.log('All estimates:', eligibilityData.estimates.map(e => e.aptc));
                    }
                }
            } catch (error) {
                console.error('Error fetching eligibility:', error);
            }
            
            // Fetch plans for each metal level separately
            const metalLevels = ['Catastrophic', 'Bronze', 'Silver', 'Gold', 'Platinum'];
            const allPlans = [];
            
            for (const metal of metalLevels) {
                const requestBody = {
                    ...baseRequestBody,
                    filter: {
                        metal_level: metal
                    }
                };
                
                const planSearchUrl = `https://marketplace.api.healthcare.gov/api/v1/plans/search?apikey=${apiKey}&limit=20`;
                
                try {
                    const planResponse = await fetch(planSearchUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (planResponse.ok) {
                        const planData = await planResponse.json();
                        console.log(`${metal} plans:`, planData.plans?.length || 0);
                        
                        if (planData.plans && planData.plans.length > 0) {
                            allPlans.push(...planData.plans);
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching ${metal} plans:`, error);
                }
            }
            
            console.log('Total plans fetched:', allPlans.length);
            
            return {
                plans: allPlans,
                aptc_amount: aptcAmount
            };
        },
        
        displayResults(data) {
            const resultsDiv = document.getElementById('results');
            
            console.log('Full API response:', data);
            
            // Check if we have plans
            if (!data.plans || data.plans.length === 0) {
                resultsDiv.innerHTML = `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 4px; border: 1px solid #856404;">
                        <strong>No plans found</strong>
                        <p>No marketplace plans available for your location and criteria.</p>
                        <details style="margin-top: 10px;">
                            <summary style="cursor: pointer;">View API Response</summary>
                            <pre style="background: #f5f5f5; padding: 10px; overflow: auto; font-size: 0.8em;">
${JSON.stringify(data, null, 2)}
                            </pre>
                        </details>
                    </div>
                `;
                return;
            }
            
            // Group plans by metal level
            const plansByMetal = {};
            data.plans.forEach(plan => {
                const metal = plan.metal_level || 'Unknown';
                if (!plansByMetal[metal]) {
                    plansByMetal[metal] = [];
                }
                plansByMetal[metal].push(plan);
            });
            
            // Calculate subsidy (APTC)
            const aptc = data.aptc_amount || data.aptc || 0;
            
            // Build results HTML
            let html = `
                <div style="background: #e8f5e9; padding: 20px; border-radius: 4px; border: 1px solid #4caf50;">
                    <h3 style="margin-bottom: 15px;">ACA Subsidy Results</h3>
            `;
            
            // Show subsidy info if available
            if (aptc > 0) {
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 4px;">
                        <div style="margin-bottom: 10px;">
                            <strong>Monthly Premium Tax Credit (APTC):</strong> 
                            <span style="font-size: 1.3em; color: #2e7d32;">$${aptc.toFixed(2)}</span>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Annual Subsidy:</strong> $${(aptc * 12).toFixed(2)}
                        </div>
                    </div>
                `;
            } else {
                // Explain why no subsidy
                const income = householdData.income;
                const householdSize = householdData.members.length;
                
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border-radius: 4px; border: 1px solid #856404;">
                        <strong>⚠ No Subsidy Available</strong>
                        <p style="margin-top: 8px; color: #856404;">
                            Household: ${householdSize} people, Income: $${income.toLocaleString()}<br>
                            Possible reasons:<br>
                            • Income may qualify for Medicaid (check your state)<br>
                            • Income too high for subsidies (>400% FPL)<br>
                            • API may need different parameters
                        </p>
                    </div>
                `;
            }
            
            // Show plan ranges by metal level
            html += `<h4 style="margin-top: 15px; margin-bottom: 10px;">Available Plans:</h4>`;
            html += `<p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">Click on a plan tier to send it to your Budget</p>`;

            ['Catastrophic', 'Bronze', 'Silver', 'Gold', 'Platinum'].forEach(metal => {
                if (plansByMetal[metal] && plansByMetal[metal].length > 0) {
                    const plans = plansByMetal[metal];

                    // Get price range
                    const premiums = plans.map(p => p.premium || 0);
                    const minPremium = Math.min(...premiums);
                    const maxPremium = Math.max(...premiums);

                    // Calculate after subsidy
                    const minAfterSubsidy = Math.max(0, minPremium - aptc);
                    const maxAfterSubsidy = Math.max(0, maxPremium - aptc);

                    // Calculate average cost for this tier (after subsidy)
                    const avgCost = (minAfterSubsidy + maxAfterSubsidy) / 2;

                    // Check if this tier is currently selected for Budget
                    const isSelected = selectedPlanTier === metal;
                    const selectedStyle = isSelected ? 'background: #e8f5e9; border: 2px solid #4caf50;' : 'background: white;';
                    const selectedBadge = isSelected ? '<span style="background: #4caf50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.75em; margin-left: 8px;">✓ In Budget</span>' : '';

                    html += `
                        <div onclick="window.modules['aca'].sendToBudget(${avgCost}, '${metal}')"
                             style="margin-bottom: 12px; padding: 12px; ${selectedStyle} border-radius: 4px;
                                    border-left: 4px solid ${this.getMetalColor(metal)}; cursor: pointer;
                                    transition: all 0.2s; ${isSelected ? 'box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);' : ''}"
                             onmouseover="this.style.background='#f5f5f5'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';"
                             onmouseout="this.style.background='${isSelected ? '#e8f5e9' : 'white'}'; this.style.boxShadow='${isSelected ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'}';">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${metal}</strong>
                                    <span style="color: #666; font-size: 0.9em;"> (${plans.length} plan${plans.length > 1 ? 's' : ''})</span>
                                    ${selectedBadge}
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.9em; color: #666;">Before subsidy:</div>
                                    <div style="font-weight: 600;">$${minPremium.toFixed(0)} - $${maxPremium.toFixed(0)}/mo</div>
                                    ${aptc > 0 ? `
                                        <div style="font-size: 0.9em; color: #666; margin-top: 4px;">After subsidy:</div>
                                        <div style="font-weight: 600; color: #2e7d32;">$${minAfterSubsidy.toFixed(0)} - $${maxAfterSubsidy.toFixed(0)}/mo</div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            
            html += `
                    <details style="margin-top: 15px;">
                        <summary style="cursor: pointer; color: #666;">View full API response</summary>
                        <pre style="background: #f5f5f5; padding: 10px; overflow: auto; font-size: 0.8em; max-height: 300px;">
${JSON.stringify(data, null, 2)}
                        </pre>
                    </details>
                </div>
            `;
            
            resultsDiv.innerHTML = html;
        },
        
        getMetalColor(metal) {
            const colors = {
                'Catastrophic': '#9e9e9e',
                'Bronze': '#cd7f32',
                'Silver': '#c0c0c0',
                'Gold': '#ffd700',
                'Platinum': '#e5e4e2'
            };
            return colors[metal] || '#666';
        },
        
        sendToBudget(monthlyCost, metalTier) {
            // Store which plan tier was selected (do this first for immediate visual feedback)
            selectedPlanTier = metalTier;
            this.save();

            // Re-render ACA results to show the new selection immediately
            if (lastResults) {
                this.displayResults(lastResults);
            }

            // Now update the Budget module data
            const budgetData = StateManager.load('budget');
            if (budgetData) {
                let expenses = budgetData.expenses || [];

                // Find the Healthcare expense (marked with isHealthcare flag)
                const healthcareIndex = expenses.findIndex(e => e.isHealthcare);

                if (healthcareIndex >= 0) {
                    // Update existing Healthcare expense
                    expenses[healthcareIndex].amount = monthlyCost;
                    expenses[healthcareIndex].frequency = 'monthly';
                    expenses[healthcareIndex].name = `Healthcare (${metalTier})`;
                    expenses[healthcareIndex].essential = true;
                } else {
                    // Create new Healthcare expense
                    expenses.push({
                        id: Date.now(),
                        name: `Healthcare (${metalTier})`,
                        amount: monthlyCost,
                        frequency: 'monthly',
                        essential: true,
                        startsIn: 0,
                        lastsFor: null,
                        isHealthcare: true
                    });
                }

                // Save back to localStorage (preserve selectedWithdrawalRate if it exists)
                budgetData.expenses = expenses;
                StateManager.save('budget', budgetData);

                // Re-render Budget module if it's currently displayed
                if (window.modules && window.modules['budget'] && window.modules['budget'].renderExpensesList) {
                    window.modules['budget'].renderExpensesList();
                    window.modules['budget'].renderSummary();
                }
            }
        },
        
        save() {
            StateManager.save('aca', { householdData, lastResults, selectedPlanTier, apiKey });
        },
        
        exportData() {
            const data = { householdData, apiKey: apiKey ? '***REDACTED***' : '' };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aca-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        clearData() {
            if (confirm('Are you sure you want to clear all ACA data? This cannot be undone.')) {
                householdData = {
                    zipcode: '',
                    state: '',
                    county: '',
                    year: 2024,
                    income: 0,
                    members: []
                };
                lastResults = null;
                // Don't clear API key
                this.save();
                this.render();
            }
        },
        
        // Public API for other modules
        getData() {
            return {
                householdData,
                hasApiKey: !!apiKey
            };
        }
    };
})();
