/**
 * ============================================
 * NAVBAR LOADER - Dynamically loads navigation
 * Edit this file to customize navbar behavior
 * ============================================
 */

document.addEventListener('DOMContentLoaded', function() {
    loadNavbar();
});

/**
 * Load navbar from config (not from navbar.html)
 * The navbar is loaded dynamically based on site-config.json
 * First checks localStorage for admin-saved changes
 */
async function loadNavbar() {
    const navbarContainer = document.querySelector('.navbar-container');
    
    if (!navbarContainer) {
        console.warn('No navbar-container found. Add <div class="navbar-container"></div> to your HTML.');
        return;
    }

    let config;
    
    // First check localStorage for admin-saved changes
    const localStorageConfig = localStorage.getItem('edc_config_backup');
    if (localStorageConfig) {
        try {
            config = JSON.parse(localStorageConfig);
            console.log('Navbar loaded from localStorage (admin edits)');
        } catch (e) {
            console.warn('Failed to parse localStorage config, falling back to file');
        }
    }
    
    // If not in localStorage, load from JSON file
    if (!config) {
        try {
            const response = await fetch('data/site-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            config = await response.json();
        } catch (error) {
            console.error('Error loading navbar config:', error);
            // Fallback to static navbar
            navbarContainer.innerHTML = createFallbackNavbar();
            initializeNavbar();
            return;
        }
    }
    
    if (!config.navigation || !config.navigation.enabled) {
        navbarContainer.innerHTML = '';
        return;
    }
    
    const nav = config.navigation;
    
    // Build navbar HTML from config
    const navbarHTML = `
        <nav class="navbar">
            <div class="container">
                <a href="${nav.logo.link}" class="logo">
                    <img src="${config.site.logo}" alt="EDC Logo" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" 
                         style="max-height: 50px;">
                    <span style="display: none;">${nav.logo.text}</span>
                </a>
                
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                
                <ul class="nav-links" id="navLinks">
                    ${nav.menu.sort((a, b) => a.order - b.order).map(item => `
                        <li><a href="${item.link}" data-section="${item.link.replace('#', '')}">${item.text}</a></li>
                    `).join('')}
                    ${nav.applyButton.enabled ? `
                        <li><a href="${nav.applyButton.link}" class="btn-apply" target="_blank" rel="noopener noreferrer">${nav.applyButton.text}</a></li>
                    ` : ''}
                </ul>
            </div>
        </nav>
        <div class="mobile-overlay" onclick="toggleMobileMenu()"></div>
    `;
    
    navbarContainer.innerHTML = navbarHTML;
    
    // Initialize navbar functionality after loading
    initializeNavbar();
}

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
 * Toggle mobile menu (called from navbar.html)
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

/**
 * Fallback navbar if navbar.html fails to load
 * Edit this to customize the fallback navbar content
 */
function createFallbackNavbar() {
    return `
        <nav class="navbar">
            <div class="container">
                <a href="index.html" class="logo">EDC</a>
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <ul class="nav-links" id="navLinks">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="#introduction">Introduction</a></li>
                    <li><a href="#overview">Company Overview</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#clients">Clients</a></li>
                    <li><a href="#team">Team</a></li>
                    <li><a href="#gallery">Gallery</a></li>
                    <li><a href="#contact">Contact</a></li>
                    <li><a href="http://54.252.186.9" class="btn-apply" target="_blank">Apply Now</a></li>
                </ul>
            </div>
        </nav>
        <div class="mobile-overlay" onclick="toggleMobileMenu()"></div>
    `;
}

// Make functions globally available
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

