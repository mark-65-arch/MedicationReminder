// Senior Medication App - Main Application Logic
// Privacy-focused with local storage only

class MedicationApp {
    constructor() {
        this.medications = [];
        this.history = [];
        this.settings = {
            soundEnabled: true,
            vibrationEnabled: true,
            highContrast: false,
            textSize: 'normal'
        };
        
        this.currentScreen = 'loading-screen';
        this.notificationPermission = false;
        
        this.init();
    }

    async init() {
        console.log('Initializing Senior Medication App...');
        
        // Load data from localStorage
        await this.loadData();
        
        // Apply saved settings
        this.applySettings();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Register service worker for PWA functionality
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
        
        // Simulate loading time for better UX
        setTimeout(() => {
            this.showScreen('main-menu');
            this.updateCurrentDate();
            this.renderTodaysSchedule();
            this.checkNotificationPermission();
        }, 2000);
    }

    // Data Management - Local Storage Only
    async loadData() {
        try {
            const medicationsData = localStorage.getItem('seniorMed_medications');
            const historyData = localStorage.getItem('seniorMed_history');
            const settingsData = localStorage.getItem('seniorMed_settings');
            
            if (medicationsData) {
                this.medications = JSON.parse(medicationsData);
            }
            
            if (historyData) {
                this.history = JSON.parse(historyData);
            }
            
            if (settingsData) {
                this.settings = { ...this.settings, ...JSON.parse(settingsData) };
            }
            
            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error loading saved data', 'error');
        }
    }

    saveData() {
        try {
            localStorage.setItem('seniorMed_medications', JSON.stringify(this.medications));
            localStorage.setItem('seniorMed_history', JSON.stringify(this.history));
            localStorage.setItem('seniorMed_settings', JSON.stringify(this.settings));
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
            this.showToast('Error saving data', 'error');
        }
    }

    // Settings Management
    applySettings() {
        const body = document.body;
        
        // Apply high contrast mode
        if (this.settings.highContrast) {
            body.classList.add('high-contrast');
        } else {
            body.classList.remove('high-contrast');
        }
        
        // Apply text size
        body.classList.remove('text-large', 'text-extra-large');
        if (this.settings.textSize === 'large') {
            body.classList.add('text-large');
        } else if (this.settings.textSize === 'extra-large') {
            body.classList.add('text-extra-large');
        }
        
        // Update settings form
        this.updateSettingsForm();
    }

    updateSettingsForm() {
        const soundCheckbox = document.getElementById('sound-enabled');
        const vibrationCheckbox = document.getElementById('vibration-enabled');
        const contrastCheckbox = document.getElementById('high-contrast');
        const textSizeSelect = document.getElementById('text-size');
        
        if (soundCheckbox) soundCheckbox.checked = this.settings.soundEnabled;
        if (vibrationCheckbox) vibrationCheckbox.checked = this.settings.vibrationEnabled;
        if (contrastCheckbox) contrastCheckbox.checked = this.settings.highContrast;
        if (textSizeSelect) textSizeSelect.value = this.settings.textSize;
    }

    // Screen Navigation
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Focus first interactive element for accessibility
            const firstFocusable = targetScreen.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
            }
        }
    }

    // Medication Management
    addMedication(medicationData) {
        const medication = {
            id: Date.now().toString(),
            name: medicationData.name.trim(),
            dosage: medicationData.dosage.trim(),
            timesPerDay: parseInt(medicationData.timesPerDay),
            times: medicationData.times,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        this.medications.push(medication);
        this.saveData();
        this.renderMedications();
        this.scheduleNotifications(medication);
        
        this.showToast(`Added ${medication.name} successfully`, 'success');
        console.log('Medication added:', medication);
    }

    deleteMedication(medicationId) {
        this.showConfirmDialog(
            'Delete Medication',
            'Are you sure you want to delete this medication? This action cannot be undone.',
            () => {
                this.medications = this.medications.filter(med => med.id !== medicationId);
                this.saveData();
                this.renderMedications();
                this.showToast('Medication deleted', 'success');
            }
        );
    }

    // Medication Actions
    markMedicationTaken(medicationId, time) {
        this.recordMedicationAction(medicationId, 'taken', time);
        this.showToast('Marked as taken', 'success');
    }

    markMedicationMissed(medicationId, time) {
        this.recordMedicationAction(medicationId, 'missed', time);
        this.showToast('Marked as missed', 'error');
    }

    markMedicationSkipped(medicationId, time) {
        this.recordMedicationAction(medicationId, 'skipped', time);
        this.showToast('Marked as skipped', 'success');
    }

    recordMedicationAction(medicationId, action, time) {
        const medication = this.medications.find(med => med.id === medicationId);
        if (!medication) return;

        const historyEntry = {
            id: Date.now().toString(),
            medicationId: medicationId,
            medicationName: medication.name,
            action: action,
            scheduledTime: time,
            actualTime: new Date().toISOString(),
            date: new Date().toDateString()
        };

        this.history.push(historyEntry);
        this.saveData();
        
        // Update UI if on history screen
        if (this.currentScreen === 'history') {
            this.renderHistory();
        }
    }

    // Notification Management
    async checkNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission === 'granted';
            
            if (!this.notificationPermission) {
                this.showNotificationModal();
            }
        }
    }

    showNotificationModal() {
        const modal = document.getElementById('notification-modal');
        modal.setAttribute('aria-hidden', 'false');
        
        const enableBtn = document.getElementById('enable-notifications');
        const skipBtn = document.getElementById('skip-notifications');
        
        enableBtn.onclick = async () => {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission === 'granted';
            modal.setAttribute('aria-hidden', 'true');
            
            if (this.notificationPermission) {
                this.showToast('Notifications enabled', 'success');
            } else {
                this.showToast('Notifications not enabled', 'error');
            }
        };
        
        skipBtn.onclick = () => {
            modal.setAttribute('aria-hidden', 'true');
        };
    }

    scheduleNotifications(medication) {
        if (!this.notificationPermission) return;
        
        medication.times.forEach(time => {
            this.scheduleNotificationForTime(medication, time);
        });
    }

    scheduleNotificationForTime(medication, time) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilNotification = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.showMedicationNotification(medication, time);
            // Schedule for next day
            this.scheduleNotificationForTime(medication, time);
        }, timeUntilNotification);
    }

    showMedicationNotification(medication, time) {
        if (!this.notificationPermission) return;
        
        const notification = new Notification(`Time for ${medication.name}`, {
            body: `Take your ${medication.dosage || ''} ${medication.name} now`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231565C0"><path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6h5v2H4V6zm0 4h5v2H4v-2zm0 4h5v2H4v-2z"/></svg>',
            requireInteraction: true,
            tag: `medication-${medication.id}-${time}`
        });
        
        // Play sound if enabled
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
        
        // Vibrate if enabled and supported
        if (this.settings.vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
        
        notification.onclick = () => {
            window.focus();
            this.showScreen('main-menu');
            notification.close();
        };
    }

    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
        } catch (error) {
            console.log('Audio not supported or failed:', error);
        }
    }

    // Update current date display
    updateCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    // UI Rendering - Today's Schedule
    renderTodaysSchedule() {
        const container = document.getElementById('todays-schedule');
        
        if (this.medications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" aria-hidden="true">💊</div>
                    <h3>No Medications Added</h3>
                    <p>Tap "Add Medication" below to get started with your medication reminders.</p>
                </div>
            `;
            return;
        }
        
        // Group medications by time
        const timeGroups = this.groupMedicationsByTime();
        
        if (Object.keys(timeGroups).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" aria-hidden="true">🕐</div>
                    <h3>No Medications Today</h3>
                    <p>Your medication schedule will appear here.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = Object.entries(timeGroups)
            .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
            .map(([time, medications]) => `
                <div class="time-block">
                    <div class="time-header">
                        <div class="time-label">
                            <div class="time-indicator"></div>
                            ${this.formatTime(time)}
                        </div>
                        ${medications.length > 1 ? `<button class="resolve-all-btn" onclick="app.resolveAllForTime('${time}')">Resolve all</button>` : ''}
                    </div>
                    <div class="medications-for-time">
                        ${medications.map(medication => `
                            <div class="med-item" role="article" aria-labelledby="med-${medication.id}-${time}">
                                <div class="med-icon">💊</div>
                                <div class="med-info">
                                    <h4 id="med-${medication.id}-${time}" class="med-name">${this.escapeHtml(medication.name)}</h4>
                                    ${medication.dosage ? `<p class="med-dosage">${this.escapeHtml(medication.dosage)}</p>` : ''}
                                </div>
                                <button class="med-status" onclick="app.toggleMedicationStatus('${medication.id}', '${time}')" 
                                        aria-label="Mark ${this.escapeHtml(medication.name)} as taken"
                                        ${this.isMedicationTakenToday(medication.id, time) ? 'class="med-status completed"' : ''}>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
    }

    // Group medications by their scheduled times
    groupMedicationsByTime() {
        const timeGroups = {};
        
        this.medications.forEach(medication => {
            medication.times.forEach(time => {
                if (!timeGroups[time]) {
                    timeGroups[time] = [];
                }
                timeGroups[time].push(medication);
            });
        });
        
        return timeGroups;
    }

    // Check if medication was taken today for specific time
    isMedicationTakenToday(medicationId, time) {
        const today = new Date().toDateString();
        return this.history.some(entry => 
            entry.medicationId === medicationId &&
            entry.scheduledTime === time &&
            entry.date === today &&
            entry.action === 'taken'
        );
    }

    // Toggle medication status (taken/not taken)
    toggleMedicationStatus(medicationId, time) {
        if (this.isMedicationTakenToday(medicationId, time)) {
            // If already taken, allow user to undo
            this.showConfirmDialog(
                'Undo Medication',
                'Do you want to mark this medication as not taken?',
                () => {
                    this.removeMedicationRecord(medicationId, time);
                    this.renderTodaysSchedule();
                    this.showToast('Medication unmarked', 'success');
                }
            );
        } else {
            this.markMedicationTaken(medicationId, time);
            this.renderTodaysSchedule();
        }
    }

    // Remove medication record for today
    removeMedicationRecord(medicationId, time) {
        const today = new Date().toDateString();
        this.history = this.history.filter(entry => 
            !(entry.medicationId === medicationId &&
              entry.scheduledTime === time &&
              entry.date === today)
        );
        this.saveData();
    }

    // Resolve all medications for a specific time
    resolveAllForTime(time) {
        const timeGroups = this.groupMedicationsByTime();
        const medications = timeGroups[time] || [];
        
        medications.forEach(medication => {
            if (!this.isMedicationTakenToday(medication.id, time)) {
                this.markMedicationTaken(medication.id, time);
            }
        });
        
        this.renderTodaysSchedule();
        this.showToast(`All medications for ${this.formatTime(time)} marked as taken`, 'success');
    }

    // Legacy method for backward compatibility
    renderMedications() {
        this.renderTodaysSchedule();
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" aria-hidden="true">📋</div>
                    <h3>No History Yet</h3>
                    <p>Your medication history will appear here after you start tracking your medications.</p>
                </div>
            `;
            return;
        }
        
        // Sort history by date (newest first)
        const sortedHistory = [...this.history].sort((a, b) => 
            new Date(b.actualTime) - new Date(a.actualTime)
        );
        
        container.innerHTML = sortedHistory.map(entry => `
            <div class="history-entry" role="article" aria-labelledby="history-${entry.id}">
                <div class="history-date">${entry.date}</div>
                <div id="history-${entry.id}" class="history-medication">${this.escapeHtml(entry.medicationName)}</div>
                <div class="history-time">Scheduled: ${this.formatTime(entry.scheduledTime)} | 
                    Recorded: ${this.formatDateTime(entry.actualTime)}</div>
                <span class="history-status status-${entry.action}" aria-label="Status: ${entry.action}">
                    ${entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                </span>
            </div>
        `).join('');
    }

    // Form Handling
    setupMedicationForm() {
        const form = document.getElementById('medication-form');
        const timesSelect = document.getElementById('med-times');
        const timeSlotsContainer = document.getElementById('time-slots');
        
        timesSelect.addEventListener('change', (e) => {
            const times = parseInt(e.target.value);
            this.generateTimeSlots(times, timeSlotsContainer);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMedicationSubmit();
        });
    }

    generateTimeSlots(count, container) {
        if (!count) {
            container.innerHTML = '';
            return;
        }
        
        const defaultTimes = ['08:00', '12:00', '18:00', '22:00'];
        
        container.innerHTML = Array.from({ length: count }, (_, i) => `
            <div class="time-input-group">
                <label for="time-${i + 1}" class="form-label">Time ${i + 1} *</label>
                <input type="time" id="time-${i + 1}" class="time-input" required 
                       value="${defaultTimes[i] || '08:00'}" 
                       aria-describedby="time-${i + 1}-help">
                <p id="time-${i + 1}-help" class="help-text">Set the time for dose ${i + 1}</p>
            </div>
        `).join('');
    }

    handleMedicationSubmit() {
        const form = document.getElementById('medication-form');
        const formData = new FormData(form);
        
        const name = document.getElementById('med-name').value;
        const dosage = document.getElementById('med-dosage').value;
        const timesPerDay = parseInt(document.getElementById('med-times').value);
        
        if (!name.trim()) {
            this.showToast('Please enter a medication name', 'error');
            document.getElementById('med-name').focus();
            return;
        }
        
        if (!timesPerDay) {
            this.showToast('Please select how many times per day', 'error');
            document.getElementById('med-times').focus();
            return;
        }
        
        const times = [];
        for (let i = 1; i <= timesPerDay; i++) {
            const timeInput = document.getElementById(`time-${i}`);
            if (timeInput && timeInput.value) {
                times.push(timeInput.value);
            }
        }
        
        if (times.length !== timesPerDay) {
            this.showToast('Please set all required times', 'error');
            return;
        }
        
        this.addMedication({
            name,
            dosage,
            timesPerDay,
            times: times.sort() // Sort times chronologically
        });
        
        form.reset();
        document.getElementById('time-slots').innerHTML = '';
        this.showScreen('main-menu');
    }

    // Data Import/Export
    exportData() {
        try {
            const data = {
                medications: this.medications,
                history: this.history,
                settings: this.settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `medication-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting data', 'error');
        }
    }

    importData() {
        const input = document.getElementById('import-file');
        input.click();
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.medications && Array.isArray(data.medications)) {
                        this.medications = data.medications;
                    }
                    if (data.history && Array.isArray(data.history)) {
                        this.history = data.history;
                    }
                    if (data.settings && typeof data.settings === 'object') {
                        this.settings = { ...this.settings, ...data.settings };
                    }
                    
                    this.saveData();
                    this.applySettings();
                    this.renderMedications();
                    
                    this.showToast('Data imported successfully', 'success');
                } catch (error) {
                    console.error('Import error:', error);
                    this.showToast('Error importing data - invalid file format', 'error');
                }
            };
            
            reader.readAsText(file);
        };
    }

    clearAllData() {
        this.showConfirmDialog(
            'Clear All Data',
            'Are you sure you want to delete all medications and history? This action cannot be undone.',
            () => {
                this.medications = [];
                this.history = [];
                localStorage.removeItem('seniorMed_medications');
                localStorage.removeItem('seniorMed_history');
                
                this.renderMedications();
                this.showToast('All data cleared', 'success');
            }
        );
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.getElementById('add-med-btn').addEventListener('click', () => {
            this.showScreen('add-medication');
            this.setupMedicationForm();
        });
        
        document.getElementById('view-history-btn').addEventListener('click', () => {
            this.showScreen('history');
            this.renderHistory();
        });
        
        // Add manage medications button handler
        const manageMedsBtn = document.getElementById('manage-meds-btn');
        if (manageMedsBtn) {
            manageMedsBtn.addEventListener('click', () => {
                this.showMedicationManagement();
            });
        }
        
        document.getElementById('backup-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showScreen('settings');
        });
        
        // Back buttons
        document.getElementById('back-from-add').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        document.getElementById('back-from-history').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        document.getElementById('back-from-settings').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        // Form buttons
        document.getElementById('cancel-add').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        // Settings
        document.getElementById('sound-enabled').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.saveData();
        });
        
        document.getElementById('vibration-enabled').addEventListener('change', (e) => {
            this.settings.vibrationEnabled = e.target.checked;
            this.saveData();
        });
        
        document.getElementById('high-contrast').addEventListener('change', (e) => {
            this.settings.highContrast = e.target.checked;
            this.saveData();
            this.applySettings();
        });
        
        document.getElementById('text-size').addEventListener('change', (e) => {
            this.settings.textSize = e.target.value;
            this.saveData();
            this.applySettings();
        });
        
        // Data management
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-data').addEventListener('click', () => {
            this.importData();
        });
        
        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearAllData();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal[aria-hidden="false"]');
                if (modal) {
                    modal.setAttribute('aria-hidden', 'true');
                }
            }
        });
    }

    // Show medication management screen (placeholder for now)\n    showMedicationManagement() {\n        // For now, just show a toast - in future this could be a dedicated management screen\n        this.showToast('Medication management coming soon', 'success');\n    }\n\n    // Utility Functions
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.setAttribute('aria-hidden', 'false');
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.setAttribute('aria-hidden', 'true');
            }, 300);
        }, 3000);
    }

    showConfirmDialog(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.setAttribute('aria-hidden', 'false');
        
        yesBtn.onclick = () => {
            onConfirm();
            modal.setAttribute('aria-hidden', 'true');
        };
        
        noBtn.onclick = () => {
            modal.setAttribute('aria-hidden', 'true');
        };
        
        yesBtn.focus();
    }

    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }

    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString();
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}

// Initialize the application
const app = new MedicationApp();

// Expose app to window for inline event handlers (keeping accessibility in mind)
window.app = app;

// Handle page visibility changes for notification scheduling
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && app.notificationPermission) {
        // Reschedule notifications when app becomes visible
        app.medications.forEach(medication => {
            app.scheduleNotifications(medication);
        });
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    app.showToast('App is working offline - all data is stored locally', 'success');
});

window.addEventListener('offline', () => {
    app.showToast('App is working offline - all data is stored locally', 'info');
});
