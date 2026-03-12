/**
 * ============================================
 * LOAD SITE - Dynamic Site Loader
 * Loads content and settings from site-config.json
 * ============================================
 */

let siteConfig = null;

/**
 * Initialize the site by loading configuration
 */
async function initSite() {
    try {
        // Load site configuration
        await loadSiteConfig();
        
        // Apply theme settings
        applyTheme();
        
        // Load all sections
        await loadNavigation();
        await loadHero();
        await loadIntroduction();
        await loadOverview();
        await loadServices();
        await loadClients();
        await loadTeam();
        await loadGallery();
        await loadContact();
        await loadFooter();
        
        // Initialize popup after everything loads
        setTimeout(() => {
            initPopup();
        }, 500);
        
        console.log('Site loaded successfully');
    } catch (error) {
        console.error('Error loading site:', error);
        // Show error message to user
        document.body.innerHTML = `
            <div style="padding: 50px; text-align: center; font-family: sans-serif;">
                <h1>Error Loading Site</h1>
                <p>There was a problem loading the site configuration.</p>
                <p>Please ensure you're running this on a local server.</p>
            </div>
        `;
    }
}

    /**
     * Load site configuration from JSON file
     * Priority: 1. URL parameter (preview), 2. localStorage (admin saves), 3. JSON file
     * This ensures admin changes are always reflected in preview
     */
    async function loadSiteConfig() {
        // 1. First check URL parameter (for admin preview) - HIGHEST PRIORITY
        const urlParams = new URLSearchParams(window.location.search);
        const previewConfig = urlParams.get('preview');
        if (previewConfig) {
            try {
                siteConfig = JSON.parse(decodeURIComponent(atob(previewConfig)));
                console.log('Loaded config from URL (admin preview)');
                // Save to localStorage for persistence
                localStorage.setItem('edc_config_preview', JSON.stringify(siteConfig));
                localStorage.setItem('edc_config_backup', JSON.stringify(siteConfig));
                return siteConfig;
            } catch (e) {
                console.warn('Failed to parse URL config, falling back to other sources');
            }
        }
        
        // 2. Check localStorage for admin-saved changes (preview mode)
        // Try the preview key first, then backup key
        const localStoragePreview = localStorage.getItem('edc_config_preview');
        if (localStoragePreview) {
            try {
                siteConfig = JSON.parse(localStoragePreview);
                console.log('Loaded config from localStorage preview');
                return siteConfig;
            } catch (e) {
                console.warn('Failed to parse localStorage preview config');
            }
        }
        
        // Try backup key
        const localStorageConfig = localStorage.getItem('edc_config_backup');
        if (localStorageConfig) {
            try {
                siteConfig = JSON.parse(localStorageConfig);
                console.log('Loaded config from localStorage (admin edits)');
                return siteConfig;
            } catch (e) {
                console.warn('Failed to parse localStorage config, falling back to file');
            }
        }
        
        // 3. Fall back to loading from JSON file
        try {
let response;
try {
  response = await fetch('/api/config');
} catch (e) {
  // Fallback for static mode
  response = await fetch('./data/site-config.json');
}
if (!response.ok) {
  throw new Error('Failed to load site configuration');
}
            if (!response.ok) {
                throw new Error('Failed to load site configuration');
            }
            siteConfig = await response.json();
            
            // Save to localStorage for future use
            localStorage.setItem('edc_config_backup', JSON.stringify(siteConfig));
            
            return siteConfig;
        } catch (e) {
            console.error('Error loading config file:', e);
            throw e;
        }
    }

/**
 * Apply theme settings to CSS variables
 */
function applyTheme() {
    if (!siteConfig || !siteConfig.theme) return;
    
    const theme = siteConfig.theme;
    const root = document.documentElement;
    
    // Apply colors
    if (theme.colors) {
        root.style.setProperty('--primary-color', theme.colors.primary);
        root.style.setProperty('--primary-light', theme.colors.primaryLight);
        root.style.setProperty('--primary-dark', theme.colors.primaryDark);
        root.style.setProperty('--secondary-color', theme.colors.secondary);
        root.style.setProperty('--secondary-light', theme.colors.secondaryLight);
        root.style.setProperty('--secondary-dark', theme.colors.secondaryDark);
        root.style.setProperty('--background-light', theme.colors.backgroundLight);
        root.style.setProperty('--background-white', theme.colors.backgroundWhite);
        root.style.setProperty('--text-dark', theme.colors.textDark);
        root.style.setProperty('--text-gray', theme.colors.textGray);
        root.style.setProperty('--text-light', theme.colors.textLight);
        root.style.setProperty('--border-color', theme.colors.borderColor);
    }
    
    // Apply button colors
    if (theme.buttons) {
        root.style.setProperty('--btn-primary', theme.buttons.primary);
        root.style.setProperty('--btn-secondary', theme.buttons.secondary);
        root.style.setProperty('--btn-hover', theme.buttons.hover);
    }
    
    // Apply shadows
    if (theme.shadows) {
        root.style.setProperty('--shadow-sm', theme.shadows.sm);
        root.style.setProperty('--shadow-md', theme.shadows.md);
        root.style.setProperty('--shadow-lg', theme.shadows.lg);
        root.style.setProperty('--shadow-xl', theme.shadows.xl);
    }
    
    // Apply fonts
    if (theme.fonts) {
        document.body.style.fontFamily = theme.fonts.primary;
    }
    
    // Apply typography
    if (theme.typography) {
        root.style.setProperty('--base-font-size', theme.typography.baseSize);
    }
}

/**
 * Load navigation from config
 */
async function loadNavigation() {
    const config = siteConfig.navigation;
    if (!config || !config.enabled) return;
    
    // Build navbar HTML
    const navbarHTML = `
        <nav class="navbar">
            <div class="container">
                <a href="${config.logo.link}" class="logo">
                    <img src="${siteConfig.site.logo}" alt="EDC Logo" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" 
                         style="max-height: 50px;">
                    <span style="display: none;">${config.logo.text}</span>
                </a>
                
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                
                <ul class="nav-links" id="navLinks">
                    ${config.menu.sort((a, b) => a.order - b.order).map(item => `
                        <li><a href="${item.link}" data-section="${item.link.replace('#', '')}">${item.text}</a></li>
                    `).join('')}
                    ${config.applyButton.enabled ? `
                        <li><a href="${config.applyButton.link}" class="btn-apply" target="_blank" rel="noopener noreferrer">${config.applyButton.text}</a></li>
                    ` : ''}
                </ul>
            </div>
        </nav>
        <div class="mobile-overlay" onclick="toggleMobileMenu()"></div>
    `;
    
    // Insert navbar
    const navbarContainer = document.querySelector('.navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;
        initializeNavbar();
    }
}

/**
 * Load hero section from config
 */
async function loadHero() {
    const config = siteConfig.hero;
    if (!config || !config.enabled) return;
    
const hero = document.querySelector('.hero');
    if (hero) {
        hero.innerHTML = `
            <div class="hero-content">
                <h1>${config.title}</h1>
                <p class="tagline">${config.tagline}</p>
                <a href="${config.buttonLink}" class="btn-hero" target="_blank" rel="noopener noreferrer">
                    ${config.buttonText}
                </a>
            </div>
        `;
        
        // Apply hero styling
        hero.style.background = `linear-gradient(${config.overlayColor}), url('${config.backgroundImage}') center/cover no-repeat`;
        hero.querySelector('.hero-content').style.color = config.textColor;
        hero.querySelector('h1').style.color = config.textColor;
    }
}

/**
 * Load introduction section from config
 */
async function loadIntroduction() {
    const config = siteConfig.introduction;
    if (!config || !config.enabled) return;
    
const section = document.getElementById('introduction');
    if (section) {
        section.innerHTML = `
            <div class="container">
                <div class="intro-grid">
                    <div class="intro-text">
                        <h2>${config.title}</h2>
                        ${config.content.map(p => `<p>${p}</p>`).join('')}
                    </div>
                    <div class="intro-image">
                        <img src="${config.image}" 
                             alt="${config.imageAlt}"
                             onerror="this.src='https://via.placeholder.com/600x400?text=Introduction+Image'">
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Load overview section from config
 */
async function loadOverview() {
    const config = siteConfig.overview;
    if (!config || !config.enabled) return;
    
const section = document.getElementById('overview');
    if (section) {
        section.innerHTML = `
            <div class="container">
                <div class="section-title">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <div class="overview-grid">
                    <div class="overview-card">
                        <span class="icon">${config.mission.icon}</span>
                        <h3>${config.mission.title}</h3>
                        <p>${config.mission.content}</p>
                    </div>
                    <div class="overview-card">
                        <span class="icon">${config.vision.icon}</span>
                        <h3>${config.vision.title}</h3>
                        <p>${config.vision.content}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Load services section from config
 */
async function loadServices() {
    const config = siteConfig.services;
    if (!config || !config.enabled) return;
    
const section = document.getElementById('services');
    if (section) {
        section.innerHTML = `
            <div class="container">
                <div class="section-title">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <div class="services-grid">
                    ${config.items.map(item => `
                        <div class="service-card">
                            <span class="icon">${item.icon}</span>
                            <h3>${item.title}</h3>
                            <p>${item.content}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

/**
 * Load clients section from config
 */
async function loadClients() {
    const config = siteConfig.clients;
    if (!config || !config.enabled) return;
    
const section = document.getElementById('clients');
    if (section) {
        section.innerHTML = `
            <div class="container">
                <div class="section-title">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <div class="clients-grid">
                    ${config.items.map(item => `
                        <div class="client-logo">
                            ${item.logo ? `<img src="${item.logo}" alt="${item.name}">` : `<span class="placeholder">${item.name}</span>`}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

/**
 * Load team section from config
 */
async function loadTeam() {
    const config = siteConfig.team;
    if (!config || !config.enabled) return;
    
const section = document.getElementById('team');
    if (section) {
        section.innerHTML = `
            <div class="container">
                <div class="section-title">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <div class="team-grid">
                    ${config.members.map(member => `
                        <div class="team-card">
                            <div class="team-image">
                                <img src="${member.image}" 
                                     alt="${member.name}"
                                     onerror="this.src='https://via.placeholder.com/300x350?text=Team+Member'">
                            </div>
                            <div class="team-info">
                                <h4>${member.name}</h4>
                                <p>${member.position}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

/**
 * Load gallery section from config
 */
async function loadGallery() {
    const config = siteConfig.gallery;
    if (!config || !config.enabled) return;
    
const section = document.getElementById('gallery');
    if (section) {
        section.innerHTML = `
            <div class="container">
                <div class="section-title">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <div class="gallery-grid">
                    ${config.images.map(img => `
                        <div class="gallery-item">
                            <img src="${img.src}" 
                                 alt="${img.alt}"
                                 onerror="this.src='https://via.placeholder.com/400x300?text=Gallery+Image'">
                            <div class="gallery-overlay">
                                <span>📷</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

/**
 * Load contact section from config
 */
async function loadContact() {
    const config = siteConfig.contact;
    if (!config || !config.enabled) return;
    
const section = document.getElementById('contact');
    if (section) {
        section.innerHTML = `
            <div class="container">
                <div class="section-title">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <div class="contact-wrapper">
                    <div class="contact-info">
                        <h3>Get In Touch</h3>
                        <div class="contact-item">
                            <div class="icon">🏢</div>
                            <div class="details">
                                <strong>Company</strong>
                                <p>${config.company}</p>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="icon">📞</div>
                            <div class="details">
                                <strong>Phone</strong>
                                <p>${config.phone}</p>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="icon">✉️</div>
                            <div class="details">
                                <strong>Email</strong>
                                <p>${config.email}</p>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="icon">📍</div>
                            <div class="details">
                                <strong>Address</strong>
                                <p>${config.address}</p>
                            </div>
                        </div>
                    </div>
                    ${config.form.enabled ? `
                        <div class="contact-form">
                            <h3>Send Us a Message</h3>
                            <form action="mailto:${config.form.emailTo}" method="POST" enctype="text/plain">
                                <div class="form-group">
                                    <label for="name">Your Name</label>
                                    <input type="text" id="name" name="name" placeholder="Enter your name" required>
                                </div>
                                <div class="form-group">
                                    <label for="email">Your Email</label>
                                    <input type="email" id="email" name="email" placeholder="Enter your email" required>
                                </div>
                                <div class="form-group">
                                    <label for="subject">Subject</label>
                                    <input type="text" id="subject" name="subject" placeholder="Enter subject" required>
                                </div>
                                <div class="form-group">
                                    <label for="message">Message</label>
                                    <textarea id="message" name="message" rows="5" placeholder="Enter your message" required></textarea>
                                </div>
                                <button type="submit" class="btn-submit">Send Message</button>
                            </form>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

/**
 * Load footer from config
 */
async function loadFooter() {
    const config = siteConfig.footer;
    if (!config || !config.enabled) return;
    
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.innerHTML = `
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h4>${config.about.title}</h4>
                        <p>${config.about.content}</p>
                    </div>
                    <div class="footer-section">
                        <h4>Quick Links</h4>
                        <ul class="footer-links">
                            ${config.quickLinks.map(link => `<li><a href="${link.link}">${link.text}</a></li>`).join('')}
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Our Services</h4>
                        <ul class="footer-links">
                            ${config.services.map(link => `<li><a href="${link.link}">${link.text}</a></li>`).join('')}
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Connect With Us</h4>
                        <p>Follow us on social media for updates and news.</p>
                        <div class="footer-social">
                            ${config.social.facebook ? `<a href="${config.social.facebook}" aria-label="Facebook">📘</a>` : ''}
                            ${config.social.twitter ? `<a href="${config.social.twitter}" aria-label="Twitter">🐦</a>` : ''}
                            ${config.social.linkedin ? `<a href="${config.social.linkedin}" aria-label="LinkedIn">💼</a>` : ''}
                            ${config.social.instagram ? `<a href="${config.social.instagram}" aria-label="Instagram">📷</a>` : ''}
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>${config.copyright}</p>
                </div>
            </div>
        `;
    }
}

/**
 * Initialize popup
 */
function initPopup() {
    const config = siteConfig.popup;
    if (!config || !config.enabled) return;
    
    // Check if popup should be shown
    const popupKey = 'edc_popup_dismissed';
    const today = new Date().toDateString();
    const dismissedDate = localStorage.getItem(popupKey);
    
    if (dismissedDate === today) {
        return; // Already shown today
    }
    
    // Create popup HTML
    const popupHTML = `
        <div class="popup-overlay" id="popup">
            <div class="popup-content" style="background: ${config.backgroundColor}; color: ${config.textColor};">
                <button class="popup-close" onclick="closePopup()">&times;</button>
                ${config.image ? `
                    <div class="popup-image">
                        <img src="${config.image}" alt="Popup"
                             onerror="this.style.display='none'">
                    </div>
                ` : ''}
                <div class="popup-text">
                    <h2 style="color: ${config.textColor};">${config.title}</h2>
                    <p>${config.description}</p>
                    ${config.buttonText && config.buttonLink ? `
                        <a href="${config.buttonLink}" class="popup-btn" style="background: ${config.buttonColor};">
                            ${config.buttonText}
                        </a>
                    ` : ''}
                    <div class="popup-dismiss">
                        <label>
                            <input type="checkbox" id="popup-dont-show"> 
                            Do not show again today
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert popup
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Show popup with animation
    setTimeout(() => {
        document.getElementById('popup').classList.add('active');
    }, 100);
}

/**
 * Close popup
 */
function closePopup() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.classList.remove('active');
        
        // Check if "do not show again" is checked
        const dontShow = document.getElementById('popup-dont-show');
        if (dontShow && dontShow.checked) {
            const today = new Date().toDateString();
            localStorage.setItem('edc_popup_dismissed', today);
        }
        
        // Remove popup from DOM after animation
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

// Make functions globally available
window.closePopup = closePopup;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initSite);

// Export for use in admin
window.loadSiteConfig = loadSiteConfig;
window.siteConfig = () => siteConfig;

/**
 * Initialize navbar scroll effects and mobile menu
 */
function initializeNavbar() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Set active link based on current page/section
        setActiveNavLink();
    }

    // Smooth scroll for anchor links
    initSmoothScroll();

    // Close mobile menu when clicking outside
    initOutsideClick();
}

/**
 * Set active navigation link based on current page or scroll position
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Check if it's the current page
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
        
        // Check scroll position for sections
        if (href && href.startsWith('#')) {
            const section = document.querySelector(href);
            if (section) {
                window.addEventListener('scroll', function() {
                    const sectionTop = section.offsetTop - 100;
                    const sectionHeight = section.offsetHeight;
                    const scrollY = window.scrollY;
                    
                    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                        link.classList.add('active');
                    } else if (!href.includes('apply')) {
                        link.classList.remove('active');
                    }
                });
            }
        }
    });
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                closeMobileMenu();
            }
        });
    });
}

/**
 * Initialize outside click to close mobile menu
 */
function initOutsideClick() {
    document.addEventListener('click', function(e) {
        const navLinks = document.getElementById('navLinks');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (navLinks && navLinks.classList.contains('active')) {
            if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const overlay = document.querySelector('.mobile-overlay');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (navLinks) {
        navLinks.classList.toggle('active');
        
        if (overlay) {
            overlay.classList.toggle('active');
        }
        
        if (menuBtn) {
            menuBtn.classList.toggle('active');
        }
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const overlay = document.querySelector('.mobile-overlay');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (navLinks) {
        navLinks.classList.remove('active');
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        if (menuBtn) {
            menuBtn.classList.remove('active');
        }
        
        document.body.style.overflow = '';
    }
}

// Make navbar functions globally available
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.initializeNavbar = initializeNavbar;

