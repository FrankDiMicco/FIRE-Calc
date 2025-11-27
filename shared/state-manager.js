// State Manager - Handles data persistence and sharing between modules
const StateManager = {
    // Save data for a specific module
    save(moduleName, data) {
        try {
            localStorage.setItem(`fire-planner-${moduleName}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    },
    
    // Load data for a specific module
    load(moduleName) {
        try {
            const data = localStorage.getItem(`fire-planner-${moduleName}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    },
    
    // Clear data for a specific module
    clear(moduleName) {
        try {
            localStorage.removeItem(`fire-planner-${moduleName}`);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    },
    
    // Clear all FIRE Planner data
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('fire-planner-')) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    },
    
    // Export all data as JSON
    exportAll() {
        const allData = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('fire-planner-')) {
                const moduleName = key.replace('fire-planner-', '');
                allData[moduleName] = this.load(moduleName);
            }
        });
        return allData;
    },
    
    // Import data from JSON
    importAll(data) {
        try {
            Object.keys(data).forEach(moduleName => {
                this.save(moduleName, data[moduleName]);
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },
    
    // Download data as JSON file
    downloadExport() {
        const data = this.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fire-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Upload and import JSON file
    uploadImport(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = this.importAll(data);
                    resolve(success);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
};

// Make StateManager globally available
window.StateManager = StateManager;
