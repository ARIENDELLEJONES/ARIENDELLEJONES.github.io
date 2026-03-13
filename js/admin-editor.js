/**
 * ============================================
 * ADMIN EDITOR - Visual Content Editor (FIXED)
 * Allows editing all site configuration from admin panel
 * ============================================
 */

const AdminEditor = {
    config: null,
    currentSection: 'general',
    hasChanges: false,
    
    init: async function() {
        try {
            this.config = await this.loadConfig();
            if (!this.config) {
                this.showNotification('Error loading configuration. Please ensure data/site-config.json exists!', 'error');
                return;
            }
            this.setupEventListeners();
            this.renderCurrentSection();
            this.setupAutoSave();
        } catch (error) {
            console.error('AdminEditor init error:', error);
            this.showNotification('Initialization failed: ' + error.message, 'error');
        }
    },

    loadConfig: async function() {
        const API_BASE = 'http://54.252.186.9/api';
        let response;
        
        try {
            response = await fetch(`${API_BASE}/config`);
        } catch (e) {
            console.log('Backend API unavailable, trying local file...');
            response = await fetch('data/site-config.json');
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch config: ' + response.statusText);
        }
        
        this.config = await response.json();
        return this.config;
    },

    saveConfig: async function(showMessage = true) {
        try {
            localStorage.setItem('edc_config_backup', JSON.stringify(this.config));
            
            const API_BASE = 'http://54.252.186.9/api';
            try {
                const response = await fetch(`${API_BASE}/config`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(this.config)
                });
                if (!response.ok) {
                    console.warn('Backend save failed:', response.status);
                }
            } catch (error) {
                console.error('Backend save error:', error);
            }
            
            this.hasChanges = false;
            this.config.lastUpdated = new Date().toISOString();
            
            if (showMessage) {
                this.showNotification('Changes saved!', 'success');
                setTimeout(() => this.downloadConfig(), 1000);
            }
            return true;
        } catch (error) {
            this.showNotification('Error saving: ' + error.message, 'error');
            return false;
        }
    },

    downloadConfig: function() {
        try {
            const configStr = JSON.stringify(this.config, null, 4);
            const blob = new Blob([configStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'site-config.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showNotification('Config downloaded! Replace data/site-config.json', 'success');
        } catch (error) {
            this.showNotification('Download error: ' + error.message, 'error');
        }
    },

    setupEventListeners: function() {
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentSection = section;
                this.renderCurrentSection();
            });
        });

        document.getElementById('save-btn')?.addEventListener('click', () => this.saveConfig());
        document.getElementById('preview-btn')?.addEventListener('click', () => this.previewSite());
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (confirm('Reset all changes?')) {
                this.loadConfig().then(() => {
                    this.renderCurrentSection();
                    this.showNotification('Reset complete', 'info');
                });
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.hasChanges) {
                e.preventDefault();
                e.returnValue = 'Unsaved changes!';
            }
        });
    },

    renderCurrentSection: function() {
        const container = document.getElementById('editor-content');
        if (!container) return;

        container.innerHTML = this.getSectionContent(this.currentSection);
        this.setupSectionListeners();
    },

    getSectionContent: function(section) {
        const renderers = {
            general: this.renderGeneralSettings.bind(this),
            navigation: this.renderNavigationSettings.bind(this),
            hero: this.renderHeroSettings.bind(this),
            content: this.renderContentSettings.bind(this),
            theme: this.renderThemeSettings.bind(this),
            images: this.renderImageSettings.bind(this),
            popup: this.renderPopupSettings.bind(this),
            github: this.renderGitHubSettings.bind(this)
        };
        return renderers[section] ? renderers[section]() : '<p>Section not implemented</p>';
    },

    renderGeneralSettings: function() {
        return `
            <h2>General Settings</h2>
            <div class="form-section">
                <div class="form-group">
                    <label>Site Name</label>
                    <input type="text" value="${this.escapeHtml(this.config.site?.name || '')}" onchange="AdminEditor.updateConfig('site.name', this.value)">
                </div>
                <div class="form-group">
                    <label>Site Description</label>
                    <textarea onchange="AdminEditor.updateConfig('site.description', this.value)">${this.escapeHtml(this.config.site?.description || '')}</textarea>
                </div>
            </div>
        `;
    },

    // Simplified renderers - add more as needed
    renderNavigationSettings: function() {
        return '<h2>Navigation</h2><div class="form-section"><p>Navigation editor coming soon...</p></div>';
    },

    renderHeroSettings: function() {
        return '<h2>Hero</h2><div class="form-section"><p>Hero settings coming soon...</p></div>';
    },

    renderContentSettings: function() {
        return '<h2>Content</h2><div class="form-section"><p>Full content editor coming soon...</p></div>';
    },

    renderThemeSettings: function() {
        return '<h2>Theme</h2><div class="form-section"><p>Theme editor coming soon...</p></div>';
    },

    renderImageSettings: function() {
        if (typeof ImageUploader !== 'undefined' && ImageUploader.createImageEditor) {
            return `
                <h2>Image Management</h2>
                <div class="form-section">
                    ${ImageUploader.createImageEditor('Hero Background', 'hero', 0, this.config.hero?.backgroundImage, 'hero.backgroundImage')}
                    ${ImageUploader.createImageEditor('Introduction Image', 'intro', 0, this.config.introduction?.image, 'introduction.image')}
                </div>
            `;
        }
        return '<h2>Images</h2><p>ImageUploader not loaded</p>';
    },

    renderPopupSettings: function() {
        return '<h2>Popup</h2><div class="form-section"><p>Popup editor coming soon...</p></div>';
    },

    renderGitHubSettings: function() {
        if (typeof GitHubPublisher !== 'undefined') {
            return `
                <h2>GitHub Publish</h2>
                <div class="form-section">
                    <div class="form-group">
                        <label>Repository</label>
                        <input type="text" value="${this.escapeHtml(this.config.github?.repoUrl || '')}" onchange="AdminEditor.updateConfig('github.repoUrl', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Token</label>
                        <input type="password" value="${this.escapeHtml(this.config.github?.token || '')}" onchange="AdminEditor.updateConfig('github.token', this.value)">
                    </div>
                    <button class="btn btn-secondary" onclick="AdminEditor.testGitHub()">Test</button>
                </div>
            `;
        }
        return '<h2>GitHub</h2><p>GitHubPublisher not loaded</p>';
    },

    setupSectionListeners: function() {
        // Section-specific listeners
    },

    updateConfig: function(path, value) {
        const keys = path.split('.');
        let obj = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const match = key.match(/(\\w+)\\[(\\d+)\\]/);
            if (match) {
                obj = obj[match[1]][parseInt(match[2])];
            } else {
                obj = obj[key];
            }
        }
        obj[keys[keys.length - 1]] = value;
        this.hasChanges = true;
    },

    previewSite: function() {
        localStorage.setItem('edc_config_preview', JSON.stringify(this.config));
        window.open('index.html', '_blank');
        this.showNotification('Preview opened!', 'success');
    },

    setupAutoSave: function() {
        setInterval(() => {
            if (this.hasChanges) {
                this.saveConfig(false);
            }
        }, 300000); // 5 minutes
    },

    testGitHub: async function() {
        if (typeof GitHubPublisher === 'undefined') {
            this.showNotification('GitHubPublisher not loaded', 'error');
            return;
        }
        GitHubPublisher.setConfig(this.config.github || {});
        const result = await GitHubPublisher.testConnection();
        const msg = result.success ? '✓ ' + result.message : '✗ ' + result.message;
        this.showNotification(msg, result.success ? 'success' : 'error');
    },

    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
};

// Global access
window.AdminEditor = AdminEditor;

// Auto-init
document.addEventListener('DOMContentLoaded', () => AdminEditor.init());
