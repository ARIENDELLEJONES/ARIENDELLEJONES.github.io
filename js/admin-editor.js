/**
 * ============================================
 * ADMIN EDITOR - Visual Content Editor
 * Allows editing all site configuration from admin panel
 * ============================================
 */

const AdminEditor = {
    config: null,
    currentSection: 'general',
    hasChanges: false,
    
    /**
     * Initialize the admin editor
     */
    init: async function() {
        const config = await this.loadConfig();
        if (!config) {
            this.showNotification('Error loading configuration. Please ensure the server is running!', 'error');
            return;
        }
        this.setupEventListeners();
        this.renderCurrentSection();
        this.setupAutoSave();
    },
    
    /**
     * Load configuration from server
     */
    loadConfig: async function() {
        try {
            // For static hosting (GitHub Pages) - load directly from JSON file
const API_BASE = 'http://54.252.186.9/api';\nlet response;\n            try {\n              response = await fetch(`${API_BASE}/config`);\n            } catch (e) {\n              response = await fetch('data/site-config.json');\n            }
            if (!response.ok) {
                throw new Error('Failed to fetch config');
            }
            this.config = await response.json();
            return this.config;
        } catch (error) {
            console.error('Error loading config:', error);
            this.showNotification('Error loading configuration. Make sure data/site-config.json exists!', 'error');
            return null;
        }
    },
    
    /**
     * Auto Save and Publish to GitHub
     * Saves config and automatically pushes to GitHub in one click
     */
    autoSaveAndPublish: async function() {
        if (!this.config.github || !this.config.github.token) {
            this.showNotification('Please configure GitHub settings first (GitHub Publish section)', 'error');
            return;
        }

        try {
            // Save to localStorage first
            localStorage.setItem('edc_config_backup', JSON.stringify(this.config));
            this.config.lastUpdated = new Date().toISOString();
            this.hasChanges = false;

            this.showNotification('Auto-saving to GitHub...', 'info');

            // Set up GitHub publisher
            GitHubPublisher.setConfig(this.config.github);

            // Prepare files to publish
            const files = [
                { path: 'data/site-config.json', message: 'Auto-save: Update site configuration' }
            ];

            // Publish to GitHub
            GitHubPublisher.publish(
                files,
                (progress) => {
                    console.log(progress);
                },
                (results) => {
                    const allSuccess = results.every(r => r.success);
                    if (allSuccess) {
                        this.showNotification('✓ Changes saved and published to GitHub!', 'success');
                        this.updateLastSaved();
                    } else {
                        const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
                        this.showNotification('✗ Save failed: ' + errors, 'error');
                    }
                },
                (error) => {
                    this.showNotification('✗ Error: ' + error, 'error');
                }
            );
        } catch (error) {
            console.error('Error auto-saving:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    },
    
    /**
     * Update last saved timestamp display
     */
    updateLastSaved: function() {
        const lastSavedEl = document.getElementById('last-saved');
        if (lastSavedEl) {
            const now = new Date();
            lastSavedEl.textContent = now.toLocaleString();
        }
    },
    
    /**
     * Save configuration to server
     * For GitHub Pages: This will save to localStorage and trigger GitHub publish
     */
    saveConfig: async function(showMessage = true) {
        try {
            // Save to localStorage as backup
            localStorage.setItem('edc_config_backup', JSON.stringify(this.config));
            
            this.hasChanges = false;
            if (showMessage) {
                this.showNotification('Changes saved! Click "Download Config" to save the file, then replace data/site-config.json', 'success');
                
                // Also automatically trigger download
                setTimeout(() => {
                    if (confirm('Download the updated config file now? Then replace data/site-config.json with it.')) {
                        this.downloadConfig();
                    }
                }, 1000);
            }
            
            // Update last updated timestamp
            this.config.lastUpdated = new Date().toISOString();
            
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            this.showNotification('Error saving configuration: ' + error.message, 'error');
            return false;
        }
    },
    
    /**
     * Download configuration as JSON file
     */
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
            
            this.showNotification('Configuration downloaded! Replace data/site-config.json with this file.', 'success');
        } catch (error) {
            console.error('Error downloading config:', error);
            this.showNotification('Error downloading configuration: ' + error.message, 'error');
        }
    },
    
    /**
     * Download all images from config as ZIP
     */
    downloadImages: async function() {
        try {
            // Collect all image URLs from config
            const imageUrls = new Set();
            
            // Site logo and favicon
            if (this.config.site.logo) imageUrls.add({ url: this.config.site.logo, name: 'logo' });
            if (this.config.site.favicon) imageUrls.add({ url: this.config.site.favicon, name: 'favicon' });
            
            // Hero background
            if (this.config.hero.backgroundImage && !this.config.hero.backgroundImage.startsWith('data:')) {
                imageUrls.add({ url: this.config.hero.backgroundImage, name: 'hero-background' });
            }
            
            // Introduction image
            if (this.config.introduction.image && !this.config.introduction.image.startsWith('data:')) {
                imageUrls.add({ url: this.config.introduction.image, name: 'introduction' });
            }
            
            // Popup image
            if (this.config.popup.image && !this.config.popup.image.startsWith('data:')) {
                imageUrls.add({ url: this.config.popup.image, name: 'popup' });
            }
            
            // Team members
            this.config.team.members.forEach((member, i) => {
                if (member.image && !member.image.startsWith('data:')) {
                    imageUrls.add({ url: member.image, name: `team-${i + 1}-${member.name.replace(/\s+/g, '-')}` });
                }
            });
            
            // Gallery images
            this.config.gallery.images.forEach((img, i) => {
                if (img.src && !img.src.startsWith('data:')) {
                    imageUrls.add({ url: img.src, name: `gallery-${i + 1}` });
                }
            });
            
            // Clients
            this.config.clients.items.forEach((client, i) => {
                if (client.logo && !client.logo.startsWith('data:')) {
                    imageUrls.add({ url: client.logo, name: `client-${i + 1}-${client.name.replace(/\s+/g, '-')}` });
                }
            });
            
            if (imageUrls.size === 0) {
                this.showNotification('No external images found to download', 'info');
                return;
            }
            
            this.showNotification(`Found ${imageUrls.size} images to download...`, 'info');
            
            // Download images as a simple list (ZIP would require a library)
            const imageList = Array.from(imageUrls);
            const listContent = imageList.map(img => img.url).join('\n');
            
            const blob = new Blob([listContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'image-urls.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification(`Found ${imageUrls.size} image URLs. Download the images manually and place in images/ folder.`, 'info');
        } catch (error) {
            console.error('Error downloading images:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    },
    
    /**
     * Export all as ZIP (using JSZip if available, otherwise download config only)
     */
    exportAll: async function() {
        try {
            // First save config
            await this.saveConfig(false);
            
            // Download config
            this.downloadConfig();
            
            // Show message about images
            this.showNotification('Config downloaded! You need to manually save any modified images (cropped ones are stored in the config as base64).', 'success');
            
            // If JSZip is available, create a proper ZIP
            if (typeof JSZip !== 'undefined') {
                const zip = new JSZip();
                
                // Add config
                zip.file('data/site-config.json', JSON.stringify(this.config, null, 4));
                
                // Add images folder with base64 images
                const imagesFolder = zip.folder('images');
                
                // Add base64 images from config
                const base64Images = this.collectBase64Images();
                for (const [name, data] of Object.entries(base64Images)) {
                    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
                    imagesFolder.file(name, base64Data, { base64: true });
                }
                
                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'edc-website-export.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showNotification('Full export downloaded!', 'success');
            }
        } catch (error) {
            console.error('Error exporting:', error);
            this.showNotification('Error exporting: ' + error.message, 'error');
        }
    },
    
    /**
     * Collect all base64 images from config
     */
    collectBase64Images: function() {
        const images = {};
        
        // Hero
        if (this.config.hero.backgroundImage && this.config.hero.backgroundImage.startsWith('data:')) {
            images['hero-background.jpg'] = this.config.hero.backgroundImage;
        }
        
        // Introduction
        if (this.config.introduction.image && this.config.introduction.image.startsWith('data:')) {
            images['introduction.jpg'] = this.config.introduction.image;
        }
        
        // Popup
        if (this.config.popup.image && this.config.popup.image.startsWith('data:')) {
            images['popup.jpg'] = this.config.popup.image;
        }
        
        // Team
        this.config.team.members.forEach((member, i) => {
            if (member.image && member.image.startsWith('data:')) {
                const ext = member.image.match(/data:image\/(\w+);/)[1] || 'jpg';
                images[`team-${i + 1}.${ext}`] = member.image;
            }
        });
        
        // Gallery
        this.config.gallery.images.forEach((img, i) => {
            if (img.src && img.src.startsWith('data:')) {
                const ext = img.src.match(/data:image\/(\w+);/)[1] || 'jpg';
                images[`gallery-${i + 1}.${ext}`] = img.src;
            }
        });
        
        return images;
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // Section navigation
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Save button
        document.getElementById('save-btn')?.addEventListener('click', () => {
            this.saveConfig();
        });
        
        // Preview button
        document.getElementById('preview-btn')?.addEventListener('click', () => {
            this.previewSite();
        });
        
        // Reset button
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all changes?')) {
                this.loadConfig().then(() => {
                    this.renderCurrentSection();
                    this.showNotification('Changes reset', 'info');
                });
            }
        });
        
        // Handle before unload if there are unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },
    
    /**
     * Switch admin section
     */
    switchSection: function(section) {
        // Update active nav item
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        
        this.currentSection = section;
        this.renderCurrentSection();
    },
    
    /**
     * Render current section
     */
    renderCurrentSection: function() {
        const container = document.getElementById('editor-content');
        if (!container) return;
        
        switch (this.currentSection) {
            case 'general':
                container.innerHTML = this.renderGeneralSettings();
                break;
            case 'navigation':
                container.innerHTML = this.renderNavigationSettings();
                break;
            case 'hero':
                container.innerHTML = this.renderHeroSettings();
                break;
            case 'content':
                container.innerHTML = this.renderContentSettings();
                break;
            case 'theme':
                container.innerHTML = this.renderThemeSettings();
                break;
            case 'images':
                container.innerHTML = this.renderImageSettings();
                break;
            case 'popup':
                container.innerHTML = this.renderPopupSettings();
                break;
            case 'github':
                container.innerHTML = this.renderGitHubSettings();
                break;
            default:
                container.innerHTML = '<p>Section not found</p>';
        }
        
        // Setup section-specific event listeners
        this.setupSectionListeners();
    },
    
    /**
     * Render General Settings
     */
    renderGeneralSettings: function() {
        return `
            <h2>General Settings</h2>
            <div class="form-section">
                <div class="form-group">
                    <label>Site Name</label>
                    <input type="text" id="site-name" value="${this.config.site.name}" onchange="AdminEditor.updateConfig('site.name', this.value)">
                </div>
                <div class="form-group">
                    <label>Site Description</label>
                    <textarea id="site-description" onchange="AdminEditor.updateConfig('site.description', this.value)">${this.config.site.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Logo URL</label>
                    <input type="text" id="site-logo" value="${this.config.site.logo}" onchange="AdminEditor.updateConfig('site.logo', this.value)">
                </div>
                <div class="form-group">
                    <label>Favicon URL</label>
                    <input type="text" id="site-favicon" value="${this.config.site.favicon}" onchange="AdminEditor.updateConfig('site.favicon', this.value)">
                </div>
            </div>
        `;
    },
    
    /**
     * Render Navigation Settings
     */
    renderNavigationSettings: function() {
        const nav = this.config.navigation;
        return `
            <h2>Navigation Settings</h2>
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${nav.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('navigation.enabled', this.checked)">
                        Enable Navigation
                    </label>
                </div>
                <h3>Logo</h3>
                <div class="form-group">
                    <label>Logo Text</label>
                    <input type="text" value="${nav.logo.text}" onchange="AdminEditor.updateConfig('navigation.logo.text', this.value)">
                </div>
                <div class="form-group">
                    <label>Logo Link</label>
                    <input type="text" value="${nav.logo.link}" onchange="AdminEditor.updateConfig('navigation.logo.link', this.value)">
                </div>
                Menu Items</h3>
                <div id="menu-items-editor">
                    ${nav.menu.sort((a, b) => a.order - b.order).map((item, index) => `
                        <div class="menu-item-editor">
                            <div class="form-row">
                                <input type="text" placeholder="Text" value="${item.text}" onchange="AdminEditor.updateMenuItem(${index}, 'text', this.value)">
                                <input type="text" placeholder="Link" value="${item.link}" onchange="AdminEditor.updateMenuItem(${index}, 'link', this.value)">
                                <input type="number" placeholder="Order" value="${item.order}" min="1" onchange="AdminEditor.updateMenuItem(${index}, 'order', parseInt(this.value))">
                                <button type="button" class="btn-danger" onclick="AdminEditor.removeMenuItem(${index})">Remove</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-secondary" onclick="AdminEditor.addMenuItem()">+ Add Menu Item</button>
                
                <h3>Apply Button</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${nav.applyButton.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('navigation.applyButton.enabled', this.checked)">
                        Enable Apply Button
                    </label>
                </div>
                <div class="form-group">
                    <label>Button Text</label>
                    <input type="text" value="${nav.applyButton.text}" onchange="AdminEditor.updateConfig('navigation.applyButton.text', this.value)">
                </div>
                <div class="form-group">
                    <label>Button Link</label>
                    <input type="text" value="${nav.applyButton.link}" onchange="AdminEditor.updateConfig('navigation.applyButton.link', this.value)">
                </div>
                
                <h3>Navigation Style</h3>
                <div class="form-group">
                    <label>Font Family</label>
                    <select onchange="AdminEditor.updateConfig('navigation.style.fontFamily', this.value)">
                        <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" ${nav.style.fontFamily.includes('Segoe UI') ? 'selected' : ''}>Segoe UI</option>
                        <option value="'Arial', sans-serif" ${nav.style.fontFamily.includes('Arial') ? 'selected' : ''}>Arial</option>
                        <option value="'Roboto', sans-serif" ${nav.style.fontFamily.includes('Roboto') ? 'selected' : ''}>Roboto</option>
                        <option value="'Open Sans', sans-serif" ${nav.style.fontFamily.includes('Open Sans') ? 'selected' : ''}>Open Sans</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Text Color</label>
                    <input type="color" value="${nav.style.textColor}" onchange="AdminEditor.updateConfig('navigation.style.textColor', this.value)">
                </div>
                <div class="form-group">
                    <label>Background Color</label>
                    <input type="color" value="${nav.style.backgroundColor}" onchange="AdminEditor.updateConfig('navigation.style.backgroundColor', this.value)">
                </div>
                <div class="form-group">
                    <label>Hover Color</label>
                    <input type="color" value="${nav.style.hoverColor}" onchange="AdminEditor.updateConfig('navigation.style.hoverColor', this.value)">
                </div>
            </div>
        `;
    },
    
    /**
     * Render Hero Settings
     */
    renderHeroSettings: function() {
        const hero = this.config.hero;
        return `
            <h2>Hero Section</h2>
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${hero.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('hero.enabled', this.checked)">
                        Enable Hero Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${hero.title}" onchange="AdminEditor.updateConfig('hero.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Tagline</label>
                    <input type="text" value="${hero.tagline}" onchange="AdminEditor.updateConfig('hero.tagline', this.value)">
                </div>
                <div class="form-group">
                    <label>Button Text</label>
                    <input type="text" value="${hero.buttonText}" onchange="AdminEditor.updateConfig('hero.buttonText', this.value)">
                </div>
                <div class="form-group">
                    <label>Button Link</label>
                    <input type="text" value="${hero.buttonLink}" onchange="AdminEditor.updateConfig('hero.buttonLink', this.value)">
                </div>
                <div class="form-group">
                    <label>Background Image</label>
                    <input type="text" value="${hero.backgroundImage}" onchange="AdminEditor.updateConfig('hero.backgroundImage', this.value)">
                    <small>Image path relative to project root</small>
                </div>
                <div class="form-group">
                    <label>Overlay Color</label>
                    <input type="color" value="${this.hexToRgba(hero.overlayColor)}" onchange="AdminEditor.updateConfig('hero.overlayColor', this.value)">
                </div>
                <div class="form-group">
                    <label>Text Color</label>
                    <input type="color" value="${hero.textColor}" onchange="AdminEditor.updateConfig('hero.textColor', this.value)">
                </div>
            </div>
        `;
    },
    
    /**
     * Render Content Settings (Introduction, Overview, Services, etc.)
     */
    renderContentSettings: function() {
        return `
            <h2>Content Editor</h2>
            
            <div class="content-tabs">
                <button class="tab-btn active" data-tab="introduction" onclick="AdminEditor.switchContentTab('introduction')">Introduction</button>
                <button class="tab-btn" data-tab="overview" onclick="AdminEditor.switchContentTab('overview')">Overview</button>
                <button class="tab-btn" data-tab="services" onclick="AdminEditor.switchContentTab('services')">Services</button>
                <button class="tab-btn" data-tab="team" onclick="AdminEditor.switchContentTab('team')">Team</button>
                <button class="tab-btn" data-tab="clients" onclick="AdminEditor.switchContentTab('clients')">Clients</button>
                <button class="tab-btn" data-tab="gallery" onclick="AdminEditor.switchContentTab('gallery')">Gallery</button>
                <button class="tab-btn" data-tab="contact" onclick="AdminEditor.switchContentTab('contact')">Contact</button>
                <button class="tab-btn" data-tab="footer" onclick="AdminEditor.switchContentTab('footer')">Footer</button>
            </div>
            
            <div id="content-editor-area">
                ${this.renderIntroductionEditor()}
            </div>
        `;
    },
    
    /**
     * Render Introduction Editor
     */
    renderIntroductionEditor: function() {
        const intro = this.config.introduction;
        return `
            <div class="form-section content-tab-panel" id="tab-introduction">
                <h3>Introduction Section</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${intro.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('introduction.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${intro.title}" onchange="AdminEditor.updateConfig('introduction.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Content Paragraphs</label>
                    ${intro.content.map((p, i) => `
                        <textarea rows="3" onchange="AdminEditor.updateConfig('introduction.content[${i}]', this.value)">${p}</textarea>
                    `).join('')}
                </div>
                <div class="form-group">
                    <label>Image</label>
                    <input type="text" value="${intro.image}" onchange="AdminEditor.updateConfig('introduction.image', this.value)">
                </div>
            </div>
        `;
    },
    
    /**
     * Render Services Editor
     */
    renderServicesEditor: function() {
        const services = this.config.services;
        const layout = services.layout || { columns: 4, alignment: 'left', itemAlignment: 'left' };
        return `
            <div class="form-section content-tab-panel" id="tab-services" style="display:none;">
                <h3>Services Section</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${services.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('services.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${services.title}" onchange="AdminEditor.updateConfig('services.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" value="${services.subtitle}" onchange="AdminEditor.updateConfig('services.subtitle', this.value)">
                </div>
                
                <!-- Layout Settings -->
                <div class="layout-settings">
                    <h4>📐 Layout Settings</h4>
                    <div class="layout-controls">
                        <div class="form-group">
                            <label>Number of Columns</label>
                            <select onchange="AdminEditor.updateConfig('services.layout.columns', parseInt(this.value))">
                                <option value="1" ${layout.columns === 1 ? 'selected' : ''}>1 Column</option>
                                <option value="2" ${layout.columns === 2 ? 'selected' : ''}>2 Columns</option>
                                <option value="3" ${layout.columns === 3 ? 'selected' : ''}>3 Columns</option>
                                <option value="4" ${layout.columns === 4 ? 'selected' : ''}>4 Columns</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Section Alignment</label>
                            <select onchange="AdminEditor.updateConfig('services.layout.alignment', this.value)">
                                <option value="left" ${layout.alignment === 'left' ? 'selected' : ''}>Align Left</option>
                                <option value="center" ${layout.alignment === 'center' ? 'selected' : ''}>Align Center</option>
                                <option value="right" ${layout.alignment === 'right' ? 'selected' : ''}>Align Right</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Item Alignment</label>
                            <select onchange="AdminEditor.updateConfig('services.layout.itemAlignment', this.value)">
                                <option value="left" ${layout.itemAlignment === 'left' ? 'selected' : ''}>Items Align Left</option>
                                <option value="center" ${layout.itemAlignment === 'center' ? 'selected' : ''}>Items Align Center</option>
                                <option value="right" ${layout.itemAlignment === 'right' ? 'selected' : ''}>Items Align Right</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <h4>Service Items</h4>
                <div id="services-editor">
                    ${services.items.map((service, index) => {
                        const serviceLayout = service.layout || { column: (index % layout.columns) + 1, order: index + 1 };
                        return `
                        <div class="item-editor">
                            <h5>Service ${index + 1}</h5>
                            <div class="form-group">
                                <label>Title</label>
                                <input type="text" value="${service.title}" onchange="AdminEditor.updateConfig('services.items[${index}].title', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Icon (emoji)</label>
                                <input type="text" value="${service.icon}" onchange="AdminEditor.updateConfig('services.items[${index}].icon', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Content</label>
                                <textarea rows="4" onchange="AdminEditor.updateConfig('services.items[${index}].content', this.value)">${service.content}</textarea>
                            </div>
                            <div class="item-layout-controls">
                                <div class="form-group">
                                    <label>Column</label>
                                    <select onchange="AdminEditor.updateConfig('services.items[${index}].layout.column', parseInt(this.value))">
                                        ${[1,2,3,4].map(col => `<option value="${col}" ${serviceLayout.column === col ? 'selected' : ''}>Column ${col}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Order/Row</label>
                                    <input type="number" value="${serviceLayout.order}" min="1" onchange="AdminEditor.updateConfig('services.items[${index}].layout.order', parseInt(this.value))">
                                </div>
                            </div>
                            <button type="button" class="btn-danger" onclick="AdminEditor.removeService(${index})">Remove Service</button>
                        </div>
                    `}).join('')}
                </div>
                <button type="button" class="btn-secondary" onclick="AdminEditor.addService()">+ Add Service</button>
            </div>
        `;
    },
    
    /**
     * Render Overview Editor
     */
    renderOverviewEditor: function() {
        const overview = this.config.overview;
        return `
            <div class="form-section content-tab-panel" id="tab-overview" style="display:none;">
                <h3>Company Overview</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${overview.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('overview.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${overview.title}" onchange="AdminEditor.updateConfig('overview.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" value="${overview.subtitle}" onchange="AdminEditor.updateConfig('overview.subtitle', this.value)">
                </div>
                <h4>Mission</h4>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${overview.mission.title}" onchange="AdminEditor.updateConfig('overview.mission.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" value="${overview.mission.icon}" onchange="AdminEditor.updateConfig('overview.mission.icon', this.value)">
                </div>
                <div class="form-group">
                    <label>Content</label>
                    <textarea rows="4" onchange="AdminEditor.updateConfig('overview.mission.content', this.value)">${overview.mission.content}</textarea>
                </div>
                <h4>Vision</h4>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${overview.vision.title}" onchange="AdminEditor.updateConfig('overview.vision.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" value="${overview.vision.icon}" onchange="AdminEditor.updateConfig('overview.vision.icon', this.value)">
                </div>
                <div class="form-group">
                    <label>Content</label>
                    <textarea rows="4" onchange="AdminEditor.updateConfig('overview.vision.content', this.value)">${overview.vision.content}</textarea>
                </div>
            </div>
        `;
    },
    
    /**
     * Render Team Editor
     */
    renderTeamEditor: function() {
        const team = this.config.team;
        const layout = team.layout || { columns: 4, alignment: 'center', itemAlignment: 'center' };
        return `
            <div class="form-section content-tab-panel" id="tab-team" style="display:none;">
                <h3>Team Section</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${team.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('team.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${team.title}" onchange="AdminEditor.updateConfig('team.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" value="${team.subtitle}" onchange="AdminEditor.updateConfig('team.subtitle', this.value)">
                </div>
                
                <!-- Layout Settings -->
                <div class="layout-settings">
                    <h4>📐 Layout Settings</h4>
                    <div class="layout-controls">
                        <div class="form-group">
                            <label>Number of Columns</label>
                            <select onchange="AdminEditor.updateConfig('team.layout.columns', parseInt(this.value))">
                                <option value="1" ${layout.columns === 1 ? 'selected' : ''}>1 Column</option>
                                <option value="2" ${layout.columns === 2 ? 'selected' : ''}>2 Columns</option>
                                <option value="3" ${layout.columns === 3 ? 'selected' : ''}>3 Columns</option>
                                <option value="4" ${layout.columns === 4 ? 'selected' : ''}>4 Columns</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Section Alignment</label>
                            <select onchange="AdminEditor.updateConfig('team.layout.alignment', this.value)">
                                <option value="left" ${layout.alignment === 'left' ? 'selected' : ''}>Align Left</option>
                                <option value="center" ${layout.alignment === 'center' ? 'selected' : ''}>Align Center</option>
                                <option value="right" ${layout.alignment === 'right' ? 'selected' : ''}>Align Right</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Item Alignment</label>
                            <select onchange="AdminEditor.updateConfig('team.layout.itemAlignment', this.value)">
                                <option value="left" ${layout.itemAlignment === 'left' ? 'selected' : ''}>Items Align Left</option>
                                <option value="center" ${layout.itemAlignment === 'center' ? 'selected' : ''}>Items Align Center</option>
                                <option value="right" ${layout.itemAlignment === 'right' ? 'selected' : ''}>Items Align Right</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <h4>Team Members</h4>
                <div id="team-editor">
                    ${team.members.map((member, index) => {
                        const memberLayout = member.layout || { column: (index % layout.columns) + 1, order: index + 1 };
                        return `
                        <div class="item-editor">
                            <h5>Team Member ${index + 1}</h5>
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" value="${member.name}" onchange="AdminEditor.updateConfig('team.members[${index}].name', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Position</label>
                                <input type="text" value="${member.position}" onchange="AdminEditor.updateConfig('team.members[${index}].position', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Photo</label>
                                <input type="text" value="${member.image}" onchange="AdminEditor.updateConfig('team.members[${index}].image', this.value)">
<input type="file" accept="image/*" onchange="AdminEditor.cropImage(this, 'team', ${index})">
                                ${member.image ? `<img src="${member.image}" alt="${member.name}" style="max-width:100px;max-height:100px;margin-top:5px;">` : ''}
                            </div>
                            <div class="item-layout-controls">
                                <div class="form-group">
                                    <label>Column</label>
                                    <select onchange="AdminEditor.updateConfig('team.members[${index}].layout.column', parseInt(this.value))">
                                        ${[1,2,3,4].map(col => `<option value="${col}" ${memberLayout.column === col ? 'selected' : ''}>Column ${col}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Order/Row</label>
                                    <input type="number" value="${memberLayout.order}" min="1" onchange="AdminEditor.updateConfig('team.members[${index}].layout.order', parseInt(this.value))">
                                </div>
                            </div>
                            <button type="button" class="btn-danger" onclick="AdminEditor.removeTeamMember(${index})">Remove Member</button>
                        </div>
                    `}).join('')}
                </div>
<button type="button" class="btn-secondary" onclick="AdminEditor.addTeamMember()">+ Add Team Member</button>
                    <button type="button" class="btn-primary" onclick="AdminEditor.saveSection('team')" style="margin-left: 10px;">💾 Save Team</button>
                </div>
            </div>
        `;
    },

    
    /**
     * Render Gallery Editor
     */
    renderGalleryEditor: function() {
        const gallery = this.config.gallery;
        return `
            <div class="form-section content-tab-panel" id="tab-gallery" style="display:none;">
                <h3>Gallery Section</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${gallery.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('gallery.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${gallery.title}" onchange="AdminEditor.updateConfig('gallery.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" value="${gallery.subtitle}" onchange="AdminEditor.updateConfig('gallery.subtitle', this.value)">
                </div>
                <h4>Gallery Images</h4>
                <div id="gallery-editor">
                    ${gallery.images.map((img, index) => `
                        <div class="item-editor">
                            <h5>Image ${index + 1}</h5>
                            <div class="form-group">
                                <label>Image Source</label>
                                <input type="text" value="${img.src}" onchange="AdminEditor.updateConfig('gallery.images[${index}].src', this.value)">
                                <input type="file" accept="image/*" onchange="AdminEditor.cropImage(this, 'gallery', ${index})">
                            </div>
                            <div class="form-group">
                                <label>Alt Text</label>
                                <input type="text" value="${img.alt}" onchange="AdminEditor.updateConfig('gallery.images[${index}].alt', this.value)">
                            </div>
                            ${img.src ? `<img src="${img.src}" alt="${img.alt}" style="max-width:100px;max-height:100px;margin-top:5px;">` : ''}
                            <button type="button" class="btn-danger" onclick="AdminEditor.removeGalleryImage(${index})">Remove Image</button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-secondary" onclick="AdminEditor.addGalleryImage()">+ Add Gallery Image</button>
            </div>
        `;
    },
    
    /**
     * Render Contact Editor
     */
    renderContactEditor: function() {
        const contact = this.config.contact;
        return `
            <div class="form-section content-tab-panel" id="tab-contact" style="display:none;">
                <h3>Contact Section</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${contact.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('contact.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${contact.title}" onchange="AdminEditor.updateConfig('contact.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" value="${contact.subtitle}" onchange="AdminEditor.updateConfig('contact.subtitle', this.value)">
                </div>
                <h4>Contact Information</h4>
                <div class="form-group">
                    <label>Company Name</label>
                    <input type="text" value="${contact.company}" onchange="AdminEditor.updateConfig('contact.company', this.value)">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" value="${contact.phone}" onchange="AdminEditor.updateConfig('contact.phone', this.value)">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="text" value="${contact.email}" onchange="AdminEditor.updateConfig('contact.email', this.value)">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" value="${contact.address}" onchange="AdminEditor.updateConfig('contact.address', this.value)">
                </div>
                <h4>Contact Form</h4>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${contact.form.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('contact.form.enabled', this.checked)">
                        Enable Contact Form
                    </label>
                </div>
                <div class="form-group">
                    <label>Email To</label>
                    <input type="text" value="${contact.form.emailTo}" onchange="AdminEditor.updateConfig('contact.form.emailTo', this.value)">
                </div>
            </div>
        `;
    },
    
    /**
     * Render Footer Editor
     */
    renderFooterEditor: function() {
        const footer = this.config.footer;
        return `
            <div class="form-section content-tab-panel" id="tab-footer" style="display:none;">
                <h3>Footer Section</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${footer.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('footer.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <h4>About Section</h4>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${footer.about.title}" onchange="AdminEditor.updateConfig('footer.about.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Content</label>
                    <textarea rows="3" onchange="AdminEditor.updateConfig('footer.about.content', this.value)">${footer.about.content}</textarea>
                </div>
                <h4>Quick Links</h4>
                <div id="footer-quicklinks-editor">
                    ${footer.quickLinks.map((link, index) => `
                        <div class="form-row">
                            <input type="text" placeholder="Text" value="${link.text}" onchange="AdminEditor.updateConfig('footer.quickLinks[${index}].text', this.value)">
                            <input type="text" placeholder="Link" value="${link.link}" onchange="AdminEditor.updateConfig('footer.quickLinks[${index}].link', this.value)">
                            <button type="button" class="btn-danger" onclick="AdminEditor.removeFooterQuickLink(${index})">Remove</button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-secondary" onclick="AdminEditor.addFooterQuickLink()">+ Add Quick Link</button>
                <h4>Services Links</h4>
                <div id="footer-services-editor">
                    ${footer.services.map((link, index) => `
                        <div class="form-row">
                            <input type="text" placeholder="Text" value="${link.text}" onchange="AdminEditor.updateConfig('footer.services[${index}].text', this.value)">
                            <input type="text" placeholder="Link" value="${link.link}" onchange="AdminEditor.updateConfig('footer.services[${index}].link', this.value)">
                            <button type="button" class="btn-danger" onclick="AdminEditor.removeFooterServiceLink(${index})">Remove</button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-secondary" onclick="AdminEditor.addFooterServiceLink()">+ Add Service Link</button>
                <h4>Social Media</h4>
                <div class="form-group">
                    <label>Facebook</label>
                    <input type="text" value="${footer.social.facebook}" onchange="AdminEditor.updateConfig('footer.social.facebook', this.value)">
                </div>
                <div class="form-group">
                    <label>Twitter</label>
                    <input type="text" value="${footer.social.twitter}" onchange="AdminEditor.updateConfig('footer.social.twitter', this.value)">
                </div>
                <div class="form-group">
                    <label>LinkedIn</label>
                    <input type="text" value="${footer.social.linkedin}" onchange="AdminEditor.updateConfig('footer.social.linkedin', this.value)">
                </div>
                <div class="form-group">
                    <label>Instagram</label>
                    <input type="text" value="${footer.social.instagram}" onchange="AdminEditor.updateConfig('footer.social.instagram', this.value)">
                </div>
                <h4>Copyright</h4>
                <div class="form-group">
                    <label>Copyright Text</label>
                    <input type="text" value="${footer.copyright}" onchange="AdminEditor.updateConfig('footer.copyright', this.value)">
                </div>
            </div>
        `;
    },
    
    /**
     * Render Clients Editor
     */
    renderClientsEditor: function() {
        const clients = this.config.clients;
        return `
            <div class="form-section content-tab-panel" id="tab-clients" style="display:none;">
                <h3>Clients Section</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${clients.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('clients.enabled', this.checked)">
                        Enable Section
                    </label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${clients.title}" onchange="AdminEditor.updateConfig('clients.title', this.value)">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" value="${clients.subtitle}" onchange="AdminEditor.updateConfig('clients.subtitle', this.value)">
                </div>
                <h4>Clients</h4>
                <div id="clients-editor">
                    ${clients.items.map((client, index) => `
                        <div class="item-editor">
                            <h5>Client ${index + 1}</h5>
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" value="${client.name}" onchange="AdminEditor.updateConfig('clients.items[${index}].name', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Logo</label>
                                <input type="text" value="${client.logo}" onchange="AdminEditor.updateConfig('clients.items[${index}].logo', this.value)">
                                <input type="file" accept="image/*" onchange="AdminEditor.cropImage(this, 'client', ${index})">
                            </div>
                            <button type="button" class="btn-danger" onclick="AdminEditor.removeClient(${index})">Remove Client</button>
                        </div>
                    `).join('')}
                </div>
<button type="button" class="btn-secondary" onclick="AdminEditor.addClient()">+ Add Client</button>
                    <button type="button" class="btn-primary" onclick="AdminEditor.saveSection('clients')" style="margin-left: 10px;">💾 Save Clients</button>
                </div>
            </div>
        `;
    },

    
    /**
     * Add team member
     */
    addTeamMember: function() {
        const layout = this.config.team.layout || { columns: 4 };
        const newMember = {
            name: 'New Team Member',
            position: 'Position',
            image: 'images/intro.jpg',
            layout: {
                column: (this.config.team.members.length % layout.columns) + 1,
                order: this.config.team.members.length + 1
            }
        };
        this.config.team.members.push(newMember);
        this.hasChanges = true;
        this.renderCurrentSection();
    },
    
    /**
     * Remove team member
     */
    removeTeamMember: function(index) {
        if (confirm('Remove this team member?')) {
            this.config.team.members.splice(index, 1);
            this.hasChanges = true;
            this.renderCurrentSection();
        }
    },
    
    /**
     * Add gallery image
     */
    addGalleryImage: function() {
        const newImage = {
            src: 'images/intro.jpg',
            alt: 'New Gallery Image'
        };
        this.config.gallery.images.push(newImage);
        this.hasChanges = true;
        this.renderCurrentSection();
    },
    
    /**
     * Remove gallery image
     */
    removeGalleryImage: function(index) {
        if (confirm('Remove this image?')) {
            this.config.gallery.images.splice(index, 1);
            this.hasChanges = true;
            this.renderCurrentSection();
        }
    },
    
    /**
     * Add client
     */
    addClient: function() {
        const newClient = {
            name: 'New Client',
            logo: ''
        };
        this.config.clients.items.push(newClient);
        this.hasChanges = true;
        this.renderCurrentSection();
    },
    
    /**
     * Remove client
     */
    removeClient: function(index) {
        if (confirm('Remove this client?')) {
            this.config.clients.items.splice(index, 1);
            this.hasChanges = true;
            this.renderCurrentSection();
        }
    },
    
    /**
     * Add footer quick link
     */
    addFooterQuickLink: function() {
        const newLink = {
            text: 'New Link',
            link: '#'
        };
        this.config.footer.quickLinks.push(newLink);
        this.hasChanges = true;
        this.renderCurrentSection();
    },
    
    /**
     * Remove footer quick link
     */
    removeFooterQuickLink: function(index) {
        if (confirm('Remove this link?')) {
            this.config.footer.quickLinks.splice(index, 1);
            this.hasChanges = true;
            this.renderCurrentSection();
        }
    },
    
    /**
     * Add footer service link
     */
    addFooterServiceLink: function() {
        const newLink = {
            text: 'New Service',
            link: '#'
        };
        this.config.footer.services.push(newLink);
        this.hasChanges = true;
        this.renderCurrentSection();
    },
    
    /**
     * Remove footer service link
     */
    removeFooterServiceLink: function(index) {
        if (confirm('Remove this service link?')) {
            this.config.footer.services.splice(index, 1);
            this.hasChanges = true;
            this.renderCurrentSection();
        }
    },
    
    /**
     * Render Theme Settings
     */
    renderThemeSettings: function() {
        const theme = this.config.theme;
        return `
            <h2>Theme & Colors</h2>
            <div class="form-section">
                <h3>Primary Colors</h3>
                <div class="color-grid">
                    <div class="form-group">
                        <label>Primary</label>
                        <input type="color" value="${theme.colors.primary}" onchange="AdminEditor.updateConfig('theme.colors.primary', this.value)">
                        <input type="text" value="${theme.colors.primary}" onchange="AdminEditor.updateConfig('theme.colors.primary', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Primary Light</label>
                        <input type="color" value="${theme.colors.primaryLight}" onchange="AdminEditor.updateConfig('theme.colors.primaryLight', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Primary Dark</label>
                        <input type="color" value="${theme.colors.primaryDark}" onchange="AdminEditor.updateConfig('theme.colors.primaryDark', this.value)">
                    </div>
                </div>
                
                <h3>Secondary Colors</h3>
                <div class="color-grid">
                    <div class="form-group">
                        <label>Secondary</label>
                        <input type="color" value="${theme.colors.secondary}" onchange="AdminEditor.updateConfig('theme.colors.secondary', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Secondary Light</label>
                        <input type="color" value="${theme.colors.secondaryLight}" onchange="AdminEditor.updateConfig('theme.colors.secondaryLight', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Secondary Dark</label>
                        <input type="color" value="${theme.colors.secondaryDark}" onchange="AdminEditor.updateConfig('theme.colors.secondaryDark', this.value)">
                    </div>
                </div>
                
                <h3>Background Colors</h3>
                <div class="color-grid">
                    <div class="form-group">
                        <label>Background Light</label>
                        <input type="color" value="${theme.colors.backgroundLight}" onchange="AdminEditor.updateConfig('theme.colors.backgroundLight', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Background White</label>
                        <input type="color" value="${theme.colors.backgroundWhite}" onchange="AdminEditor.updateConfig('theme.colors.backgroundWhite', this.value)">
                    </div>
                </div>
                
                <h3>Text Colors</h3>
                <div class="color-grid">
                    <div class="form-group">
                        <label>Text Dark</label>
                        <input type="color" value="${theme.colors.textDark}" onchange="AdminEditor.updateConfig('theme.colors.textDark', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Text Gray</label>
                        <input type="color" value="${theme.colors.textGray}" onchange="AdminEditor.updateConfig('theme.colors.textGray', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Text Light</label>
                        <input type="color" value="${theme.colors.textLight}" onchange="AdminEditor.updateConfig('theme.colors.textLight', this.value)">
                    </div>
                </div>
                
                <h3>Button Colors</h3>
                <div class="color-grid">
                    <div class="form-group">
                        <label>Primary Button</label>
                        <input type="color" value="${theme.buttons.primary}" onchange="AdminEditor.updateConfig('theme.buttons.primary', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Secondary Button</label>
                        <input type="color" value="${theme.buttons.secondary}" onchange="AdminEditor.updateConfig('theme.buttons.secondary', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Hover</label>
                        <input type="color" value="${theme.buttons.hover}" onchange="AdminEditor.updateConfig('theme.buttons.hover', this.value)">
                    </div>
                </div>
                
                <h3>Typography</h3>
                <div class="form-group">
                    <label>Primary Font</label>
                    <select onchange="AdminEditor.updateConfig('theme.fonts.primary', this.value)">
                        <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" ${theme.fonts.primary.includes('Segoe UI') ? 'selected' : ''}>Segoe UI</option>
                        <option value="'Arial', sans-serif" ${theme.fonts.primary.includes('Arial') ? 'selected' : ''}>Arial</option>
                        <option value="'Roboto', sans-serif" ${theme.fonts.primary.includes('Roboto') ? 'selected' : ''}>Roboto</option>
                        <option value="'Open Sans', sans-serif" ${theme.fonts.primary.includes('Open Sans') ? 'selected' : ''}>Open Sans</option>
                        <option value="'Poppins', sans-serif" ${theme.fonts.primary.includes('Poppins') ? 'selected' : ''}>Poppins</option>
                    </select>
                </div>
                
                <button type="button" class="btn-primary" onclick="AdminEditor.previewTheme()">Preview Theme</button>
            </div>
        `;
    },
    
    /**
     * Render Image Settings
     */
    renderImageSettings: function() {
        return `
            <h2>Image Management</h2>
            <div class="form-section">
                <div class="info-box" style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                    <h4 style="margin-top: 0; color: #1565c0;">📤 How to Upload Images</h4>
                    <ol style="margin: 0; padding-left: 20px; color: #333;">
                        <li>Select an image file below</li>
                        <li>Preview will appear automatically</li>
                        <li>Click "Download Image to Upload" button</li>
                        <li>Save the file to <code>images/uploads/</code> folder</li>
                        <li>Click "Save Changes" button</li>
                        <li>Push to GitHub to see on live site</li>
                    </ol>
                </div>
                
                <h3>🏠 Hero Background</h3>
                ${ImageUploader.createImageEditor('Background Image', 'hero', 0, this.config.hero.backgroundImage, 'hero.backgroundImage')}
                
                <h3>📝 Introduction Image</h3>
                ${ImageUploader.createImageEditor('Introduction Image', 'intro', 0, this.config.introduction.image, 'introduction.image')}
                
                <h3>📢 Popup Image</h3>
                ${ImageUploader.createImageEditor('Popup Image', 'popup', 0, this.config.popup.image, 'popup.image')}
                
                <h3>👥 Team Photos</h3>
                <div class="image-grid">
                    ${this.config.team.members.map((member, index) => `
                        <div class="image-item" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <label style="font-weight: bold;">${member.name} - ${member.position}</label>
                            ${ImageUploader.createImageEditor('Photo', 'team', index, member.image, `team.members[${index}].image`)}
                        </div>
                    `).join('')}
                </div>
                
                <h3>🖼️ Gallery Images</h3>
                <div class="image-grid">
                    ${this.config.gallery.images.map((img, index) => `
                        <div class="image-item" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <label style="font-weight: bold;">Image ${index + 1}</label>
                            ${ImageUploader.createImageEditor('Gallery Image', 'gallery', index, img.src, `gallery.images[${index}].src`)}
                        </div>
                    `).join('')}
                </div>
                
                <h3>🏢 Client Logos</h3>
                <div class="image-grid">
                    ${this.config.clients.items.map((client, index) => `
                        <div class="image-item" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <label style="font-weight: bold;">${client.name}</label>
                            ${ImageUploader.createImageEditor('Logo', 'client', index, client.logo, `clients.items[${index}].logo`)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Render Popup Settings
     */
    renderPopupSettings: function() {
        const popup = this.config.popup;
        return `
            <h2>Popup Editor</h2>
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${popup.enabled ? 'checked' : ''} onchange="AdminEditor.updateConfig('popup.enabled', this.checked)">
                        Enable Popup
                    </label>
                </div>
                
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" value="${popup.title}" onchange="AdminEditor.updateConfig('popup.title', this.value)">
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea rows="4" onchange="AdminEditor.updateConfig('popup.description', this.value)">${popup.description}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Image</label>
                    <input type="text" value="${popup.image}" onchange="AdminEditor.updateConfig('popup.image', this.value)">
                </div>
                
                <div class="form-group">
                    <label>Button Text</label>
                    <input type="text" value="${popup.buttonText}" onchange="AdminEditor.updateConfig('popup.buttonText', this.value)">
                </div>
                
                <div class="form-group">
                    <label>Button Link</label>
                    <input type="text" value="${popup.buttonLink}" onchange="AdminEditor.updateConfig('popup.buttonLink', this.value)">
                </div>
                
                <h3>Colors</h3>
                <div class="color-grid">
                    <div class="form-group">
                        <label>Background Color</label>
                        <input type="color" value="${this.hexToRgba(popup.backgroundColor)}" onchange="AdminEditor.updateConfig('popup.backgroundColor', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Text Color</label>
                        <input type="color" value="${popup.textColor}" onchange="AdminEditor.updateConfig('popup.textColor', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Button Color</label>
                        <input type="color" value="${popup.buttonColor}" onchange="AdminEditor.updateConfig('popup.buttonColor', this.value)">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Show Again Duration (days)</label>
                    <input type="number" value="${popup.showAgainDuration}" min="1" max="30" onchange="AdminEditor.updateConfig('popup.showAgainDuration', parseInt(this.value))">
                </div>
                
                <button type="button" class="btn-secondary" onclick="AdminEditor.testPopup()">Test Popup</button>
            </div>
        `;
    },
    
    /**
     * Render GitHub Settings
     */
    renderGitHubSettings: function() {
        const github = this.config.github;
        return `
            <h2>GitHub Publish Panel</h2>
            <div class="form-section">
                <div class="form-group">
                    <label>Repository URL</label>
                    <input type="text" id="github-repo" value="${github.repoUrl}" placeholder="https://github.com/username/repo" onchange="AdminEditor.updateConfig('github.repoUrl', this.value)">
                </div>
                
                <div class="form-group">
                    <label>GitHub Username</label>
                    <input type="text" id="github-username" value="${github.username}" placeholder="username" onchange="AdminEditor.updateConfig('github.username', this.value)">
                </div>
                
                <div class="form-group">
                    <label>Personal Access Token</label>
                    <input type="password" id="github-token" value="${github.token}" placeholder="ghp_xxxxxxxxxxxx" onchange="AdminEditor.updateConfig('github.token', this.value)">
                    <small>Create a token with 'repo' scope at GitHub Settings > Developer settings > Personal access tokens</small>
                </div>
                
                <div class="form-group">
                    <label>Branch</label>
                    <input type="text" id="github-branch" value="${github.branch}" placeholder="main" onchange="AdminEditor.updateConfig('github.branch', this.value)">
                </div>
                
                <div class="button-group">
                    <button type="button" class="btn-secondary" onclick="AdminEditor.testGitHubConnection()">Test Connection</button>
                    <button type="button" class="btn-primary" onclick="AdminEditor.publishToGitHub()">Publish Website</button>
                </div>
                
                <div id="github-status" class="status-message"></div>
            </div>
        `;
    },
    
    /**
     * Setup section-specific event listeners
     */
    setupSectionListeners: function() {
        // This is called after rendering each section
        // Additional event listeners can be added here
    },
    
    /**
     * Update configuration value
     */
    updateConfig: function(path, value) {
        const keys = path.split('.');
        let obj = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            // Handle array indices
            const match = key.match(/^(\w+)\[(\d+)\]$/);
            if (match) {
                if (!obj[match[1]]) obj[match[1]] = [];
                obj = obj[match[1]];
                i++;
                key = keys[i];
            }
            obj = obj[key];
        }
        
        const lastKey = keys[keys.length - 1];
        const arrayMatch = lastKey.match(/^(\w+)\[(\d+)\]$/);
        
        if (arrayMatch) {
            obj[arrayMatch[1]][parseInt(arrayMatch[2])] = value;
        } else {
            obj[lastKey] = value;
        }
        
        this.hasChanges = true;
    },
    
    /**
     * Add menu item
     */
    addMenuItem: function() {
        const newItem = {
            text: 'New Item',
            link: '#section',
            order: this.config.navigation.menu.length + 1
        };
        this.config.navigation.menu.push(newItem);
        this.hasChanges = true;
        this.renderCurrentSection();
    },
    
    /**
     * Update menu item
     */
    updateMenuItem: function(index, field, value) {
        this.config.navigation.menu[index][field] = value;
        this.hasChanges = true;
    },
    
    /**
     * Remove menu item
     */
    removeMenuItem: function(index) {
        if (confirm('Remove this menu item?')) {
            this.config.navigation.menu.splice(index, 1);
            this.hasChanges = true;
            this.renderCurrentSection();
        }
    },
    
    /**
     * Add service
     */
    addService: function() {
        const newService = {
            title: 'New Service',
            icon: '✨',
            content: 'Service description here.'
        };
        this.config.services.items.push(newService);
        this.hasChanges = true;
        this.renderCurrentSection();
    },
    
    /**
     * Remove service
     */
    removeService: function(index) {
        if (confirm('Remove this service?')) {
            this.config.services.items.splice(index, 1);
            this.hasChanges = true;
            this.renderCurrentSection();
        }
    },
    
    /**
     * Switch content tab
     */
    switchContentTab: function(tab) {
        const self = AdminEditor;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Hide all panels
        document.querySelectorAll('.content-tab-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Show selected panel
        const panel = document.getElementById('tab-' + tab);
        if (panel) {
            panel.style.display = 'block';
        } else {
            // Render the panel if not exists
            const contentArea = document.getElementById('content-editor-area');
            switch(tab) {
                case 'introduction':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                case 'overview':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                case 'services':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                case 'team':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                case 'gallery':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                case 'contact':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                case 'footer':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                case 'clients':
                    contentArea.innerHTML = self.renderIntroductionEditor() + self.renderOverviewEditor() + self.renderServicesEditor() + self.renderTeamEditor() + self.renderGalleryEditor() + self.renderContactEditor() + self.renderFooterEditor() + self.renderClientsEditor();
                    break;
                default:
                    contentArea.innerHTML = '<p>Editor coming soon for this section.</p>';
            }
        }
    },
    
    /**
     * Crop and upload image
     */
    cropImage: function(input, type, index) {
        const file = input.files[0];
        if (!file) return;
        
        // Create cropper modal
        this.createCropperModal(file, type, index);
    },
    
    /**
     * Create cropper modal
     */
    createCropperModal: function(file, type, index) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgData = e.target.result;
            
            // Create modal
            const modal = document.createElement('div');
            modal.id = 'cropper-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;justify-content:center;align-items:center;flex-direction:column;';
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'background:white;padding:20px;border-radius:8px;max-width:90%;max-height:90%;overflow:auto;';
            
            const title = document.createElement('h3');
            title.textContent = 'Crop Image';
            title.style.marginTop = '0';
            
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'max-width:100%;max-height:400px;overflow:hidden;margin:15px 0;';
            
            const img = document.createElement('img');
            img.src = imgData;
            img.id = 'cropper-image';
            img.style.cssText = 'max-width:100%;max-height:400px;';
            
            imgContainer.appendChild(img);
            
            // Crop controls
            const controls = document.createElement('div');
            controls.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;';
            
            const aspectLabel = document.createElement('label');
            aspectLabel.textContent = 'Aspect Ratio: ';
            controls.appendChild(aspectLabel);
            
            const aspectSelect = document.createElement('select');
            aspectSelect.id = 'aspect-ratio';
            aspectSelect.style.cssText = 'padding:5px;margin-bottom:5px;';
            aspectSelect.innerHTML = `
                <option value="0">Free</option>
                <option value="1">1:1</option>
                <option value="4/3">4:3</option>
                <option value="16/9">16:9</option>
                <option value="3/4">3:4</option>
            `;
            controls.appendChild(aspectSelect);
            
            const buttonGroup = document.createElement('div');
            buttonGroup.style.cssText = 'display:flex;gap:10px;margin-top:10px;';
            
            const cropBtn = document.createElement('button');
            cropBtn.textContent = 'Apply Crop';
            cropBtn.className = 'btn btn-primary';
            cropBtn.onclick = function() { AdminEditor.applyCrop(img, type, index, modal); };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.onclick = function() { modal.remove(); };
            
            const resetBtn = document.createElement('button');
            resetBtn.textContent = 'Reset';
            resetBtn.className = 'btn btn-secondary';
            resetBtn.onclick = function() { 
                if (img.cropper) {
                    img.cropper.reset();
                }
            };
            
            buttonGroup.appendChild(cropBtn);
            buttonGroup.appendChild(resetBtn);
            buttonGroup.appendChild(cancelBtn);
            
            modalContent.appendChild(title);
            modalContent.appendChild(controls);
            modalContent.appendChild(imgContainer);
            modalContent.appendChild(buttonGroup);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Initialize Cropper.js if available, otherwise use simple crop
            if (typeof Cropper !== 'undefined') {
                const cropper = new Cropper(img, {
                    aspectRatio: NaN,
                    viewMode: 1,
                    ready: function() {
                        aspectSelect.addEventListener('change', function() {
                            const value = this.value;
                            if (value === '0') {
                                cropper.setAspectRatio(NaN);
                            } else {
                                cropper.setAspectRatio(eval(value));
                            }
                        });
                    }
                });
                img.cropper = cropper;
            } else {
                // Simple crop without library - use canvas
                AdminEditor.setupSimpleCrop(img, modal, type, index);
            }
        };
        reader.readAsDataURL(file);
    },
    
    /**
     * Setup simple crop without external library
     */
    setupSimpleCrop: function(img, modal, type, index) {
        const modalContent = modal.querySelector('div');
        const imgContainer = modalContent.querySelector('div');
        
        // Add crop coordinates inputs
        const cropControls = document.createElement('div');
        cropControls.id = 'simple-crop-controls';
        cropControls.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0;';
        cropControls.innerHTML = `
            <div>
                <label>X Position: <input type="number" id="crop-x" value="0" min="0" style="width:60px;"></label>
            </div>
            <div>
                <label>Y Position: <input type="number" id="crop-y" value="0" min="0" style="width:60px;"></label>
            </div>
            <div>
                <label>Width: <input type="number" id="crop-width" value="200" min="50" style="width:60px;"></label>
            </div>
            <div>
                <label>Height: <input type="number" id="crop-height" value="200" min="50" style="width:60px;"></label>
            </div>
        `;
        
        // Insert before button group
        const buttonGroup = modalContent.querySelector('div:last-child');
        modalContent.insertBefore(cropControls, buttonGroup);
        
        // Update crop button
        const cropBtn = buttonGroup.querySelector('button:first-child');
        cropBtn.onclick = function() {
            const x = parseInt(document.getElementById('crop-x').value) || 0;
            const y = parseInt(document.getElementById('crop-y').value) || 0;
            const width = parseInt(document.getElementById('crop-width').value) || 200;
            const height = parseInt(document.getElementById('crop-height').value) || 200;
            
            AdminEditor.applySimpleCrop(img.src, x, y, width, height, type, index, modal);
        };
    },
    
    /**
     * Apply simple crop using canvas
     */
    applySimpleCrop: function(imgData, x, y, width, height, type, index, modal) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = function() {
            canvas.width = width;
            canvas.height = height;
            
            // Draw cropped portion
            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
            
            // Get cropped data as base64
            const croppedData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Update config
            AdminEditor.saveCroppedImage(croppedData, type, index);
            
            // Close modal
            modal.remove();
        };
        img.src = imgData;
    },
    
    /**
     * Apply crop (with Cropper.js)
     */
    applyCrop: function(img, type, index, modal) {
        if (img.cropper) {
            const canvas = img.cropper.getCroppedCanvas({
                maxWidth: 1200,
                maxHeight: 1200,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            
            const croppedData = canvas.toDataURL('image/jpeg', 0.9);
            this.saveCroppedImage(croppedData, type, index);
            modal.remove();
        } else {
            // Use simple crop
            this.applySimpleCrop(img.src, 
                parseInt(document.getElementById('crop-x').value) || 0,
                parseInt(document.getElementById('crop-y').value) || 0,
                parseInt(document.getElementById('crop-width').value) || 200,
                parseInt(document.getElementById('crop-height').value) || 200,
                type, index, modal);
        }
    },
    
    /**
     * Save cropped image to config
     */
    saveCroppedImage: function(base64Data, type, index) {
        // In a real implementation, this would upload to server
        // For demo, we'll use the base64 data directly or save locally
        
        console.log('Image cropped:', type, index);
        
        // Update the config based on type
        switch(type) {
            case 'hero':
                this.updateConfig('hero.backgroundImage', base64Data);
                break;
            case 'intro':
                this.updateConfig('introduction.image', base64Data);
                break;
            case 'popup':
                this.updateConfig('popup.image', base64Data);
                break;
            case 'team':
                this.updateConfig('team.members[' + index + '].image', base64Data);
                break;
            case 'gallery':
                this.updateConfig('gallery.images[' + index + '].src', base64Data);
                break;
            case 'client':
                this.updateConfig('clients.items[' + index + '].logo', base64Data);
                break;
        }
        
        this.hasChanges = true;
        this.showNotification('Image cropped and applied!', 'success');
        
        // Re-render to show changes
        this.renderCurrentSection();
    },
    
    /**
     * Upload image
     */
    uploadImage: function(input, type, index) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            // In a real implementation, this would upload to server
            // For now, we'll use localStorage for preview
            console.log('Image uploaded:', type, index);
            AdminEditor.showNotification('Image uploaded! In production, this would be saved to the server.', 'info');
        };
        reader.readAsDataURL(file);
    },
    
    /**
     * Preview theme
     */
    previewTheme: function() {
        // Save current config and open preview
        const previewWindow = window.open('index.html', '_blank');
        this.showNotification('Preview will open in a new tab with current settings', 'info');
    },
    
    /**
     * Test popup
     */
    testPopup: function() {
        // Reset popup to show
        localStorage.removeItem('edc_popup_dismissed');
        
        // Open index.html to test
        const previewWindow = window.open('index.html', '_blank');
        this.showNotification('Popup will appear when the page loads', 'info');
    },
    
    /**
     * Test GitHub connection
     */
    async testGitHubConnection() {
        const statusDiv = document.getElementById('github-status');
        statusDiv.innerHTML = '<p>Testing connection...</p>';
        statusDiv.className = 'status-message info';
        
        // Update config from inputs
        this.config.github.repoUrl = document.getElementById('github-repo').value;
        this.config.github.token = document.getElementById('github-token').value;
        
        GitHubPublisher.setConfig(this.config.github);
        const result = await GitHubPublisher.testConnection();
        
        if (result.success) {
            statusDiv.innerHTML = `<p class="success">✓ ${result.message}</p>`;
            statusDiv.className = 'status-message success';
        } else {
            statusDiv.innerHTML = `<p class="error">✗ ${result.message}</p>`;
            statusDiv.className = 'status-message error';
        }
    },
    
    /**
     * Publish to GitHub
     */
    async publishToGitHub() {
        // First save config
        await this.saveConfig(false);
        
        const statusDiv = document.getElementById('github-status');
        statusDiv.innerHTML = '<p>Publishing to GitHub...</p>';
        statusDiv.className = 'status-message info';
        
        // Update config from inputs
        this.config.github.repoUrl = document.getElementById('github-repo').value;
        this.config.github.token = document.getElementById('github-token').value;
        this.config.github.branch = document.getElementById('github-branch').value;
        
        GitHubPublisher.setConfig(this.config.github);
        
        // Get all image paths from config
        const imagePaths = this.getAllImagePathsFromConfig();
        
        // Build files list - include index.html, config, CSS, and images
        const files = [
            { path: 'index.html', message: 'Update index.html' },
            { path: 'data/site-config.json', message: 'Update site configuration' },
            { path: 'css/style.css', message: 'Update styles' }
        ];
        
        // Add images to the publish list
        imagePaths.forEach(imgPath => {
            // Only add images from uploads folder (not base64 and not external URLs)
            if (imgPath.startsWith('images/uploads/') && !imgPath.startsWith('http')) {
                files.push({ 
                    path: imgPath, 
                    message: `Update image: ${imgPath}` 
                });
            }
        });
        
        console.log('Publishing files:', files.map(f => f.path));
        
        GitHubPublisher.publish(
            files,
            (progress) => {
                statusDiv.innerHTML = `<p>${progress}</p>`;
            },
            (results) => {
                const allSuccess = results.every(r => r.success);
                if (allSuccess) {
                    statusDiv.innerHTML = '<p class="success">✓ All files published successfully!</p>';
                    statusDiv.className = 'status-message success';
                    this.showNotification('✓ All files (including images) published to GitHub!', 'success');
                } else {
                    const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
                    statusDiv.innerHTML = `<p class="error">✗ Some files failed: ${errors}</p>`;
                    statusDiv.className = 'status-message error';
                }
            },
            (error) => {
                statusDiv.innerHTML = `<p class="error">✗ ${error}</p>`;
                statusDiv.className = 'status-message error';
            }
        );
    },
    
    /**
     * Get all image paths from current config (for GitHub publishing)
     * Returns array of image paths that exist in images/uploads/
     */
    getAllImagePathsFromConfig: function() {
        const images = new Set();
        
        // Helper to add image
        const addImage = (path) => {
            if (path && !path.startsWith('data:') && !path.startsWith('http') && path.includes('images/')) {
                images.add(path);
            }
        };
        
        // Site logo and favicon
        addImage(this.config.site?.logo);
        addImage(this.config.site?.favicon);
        
        // Hero
        addImage(this.config.hero?.backgroundImage);
        
        // Introduction
        addImage(this.config.introduction?.image);
        
        // Popup
        addImage(this.config.popup?.image);
        
        // Team members
        this.config.team?.members?.forEach((member) => {
            addImage(member.image);
        });
        
        // Gallery
        this.config.gallery?.images?.forEach((img) => {
            addImage(img.src);
        });
        
        // Clients
        this.config.clients?.items?.forEach((client) => {
            addImage(client.logo);
        });
        
        return Array.from(images);
    },
    
    /**
     * Preview site - saves changes and passes config via URL
     * Also saves to localStorage so index.html can read it directly
     */
    previewSite: function() {
        // Save current config to localStorage as backup (for both admin and preview)
        localStorage.setItem('edc_config_backup', JSON.stringify(this.config));
        // Also save to a dedicated preview key that index.html checks first
        localStorage.setItem('edc_config_preview', JSON.stringify(this.config));
        this.hasChanges = false;
        
        // Encode config as base64 to pass via URL (for direct preview)
        const configStr = JSON.stringify(this.config);
        const encodedConfig = btoa(encodeURIComponent(configStr));
        
        // Build URL with config parameter
        const previewUrl = 'index.html?preview=' + encodedConfig;
        
        this.showNotification('Changes saved! Opening preview...', 'info');
        
        // Open index.html with config in URL
        setTimeout(() => {
            window.open(previewUrl, '_blank');
        }, 500);
    },
    
    /**
     * Setup auto-save
     */
    setupAutoSave: function() {
        // Auto-save every 5 minutes
        setInterval(() => {
            if (this.hasChanges) {
                this.saveConfig(false);
                console.log('Auto-saved configuration');
            }
        }, 300000);
    },
    
    /**
     * Show notification
     */
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    /**
     * Convert hex to rgba
     */
    hexToRgba: function(hex) {
        if (hex.startsWith('rgba')) return hex;
        
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, 0.85)`;
    }
};

// Make globally available
window.AdminEditor = AdminEditor;

AdminEditor.saveSection = function(section) {
    localStorage.setItem('edc_config_backup', JSON.stringify(AdminEditor.config));
    AdminEditor.hasChanges = false;
    AdminEditor.showNotification(`✓ ${section.charAt(0).toUpperCase() + section.slice(1)} saved! Changes now visible in Image Management.`, 'success');
};


