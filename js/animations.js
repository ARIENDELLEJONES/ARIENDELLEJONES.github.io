/**
 * ============================================
 * ANIMATIONS - Scroll animations and effects
 * Customizable animation settings
 * ============================================
 */

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initParallax();
    initHoverAnimations();
    initCounterAnimations();
    initImageEffects();
});

/**
 * Initialize scroll-triggered animations
 * Elements with class "animate-on-scroll" will fade in when scrolled into view
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for grid items
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, delay);
                
                // Stop observing after animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Initialize parallax effect for hero section
 */
function initParallax() {
    const hero = document.querySelector('.hero');
    
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.pageYOffset;
            const heroHeight = hero.offsetHeight;
            
            if (scrollPosition < heroHeight) {
                // Apply parallax only within hero section
                hero.style.backgroundPositionY = (scrollPosition * 0.5) + 'px';
            }
        });
    }
}

/**
 * Initialize hover animations for various elements
 */
function initHoverAnimations() {
    // Service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Team cards
    const teamCards = document.querySelectorAll('.team-card');
    teamCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const img = this.querySelector('.team-image img');
            if (img) {
                img.style.transform = 'scale(1.1)';
            }
        });
        card.addEventListener('mouseleave', function() {
            const img = this.querySelector('.team-image img');
            if (img) {
                img.style.transform = 'scale(1)';
            }
        });
    });
    
    // Gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const img = this.querySelector('img');
            if (img) {
                img.style.transform = 'scale(1.15)';
            }
        });
        item.addEventListener('mouseleave', function() {
            const img = this.querySelector('img');
            if (img) {
                img.style.transform = 'scale(1)';
            }
        });
    });
    
    // Navigation links hover effect
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
    
    // Buttons hover effect
    const buttons = document.querySelectorAll('.btn-hero, .btn-submit, .btn-apply');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Initialize number counter animations
 * Use data attributes: data-count="100" data-suffix="+"
 */
function initCounterAnimations() {
    const counters = document.querySelectorAll('[data-count]');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                const suffix = counter.getAttribute('data-suffix') || '';
                const duration = parseInt(counter.getAttribute('data-duration')) || 2000;
                
                animateCounter(counter, target, suffix, duration);
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

/**
 * Animate counter from 0 to target
 */
function animateCounter(element, target, suffix, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * target);
        element.textContent = value + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Initialize image effects
 */
function initImageEffects() {
    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
    
    // Image hover zoom effect
    const zoomImages = document.querySelectorAll('.img-zoom');
    zoomImages.forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        img.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(targetId) {
    const target = document.querySelector(targetId);
    if (target) {
        const navHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = target.offsetTop - navHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * Add floating animation to element
 */
function addFloatingAnimation(element, amplitude = 10, duration = 3000) {
    element.style.animation = `float ${duration}ms ease-in-out infinite`;
}

/**
 * Reveal elements on scroll (alternative method)
 */
function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    
    window.addEventListener('scroll', function() {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;
        
        reveals.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('revealed');
            }
        });
    });
}

// Make functions globally available
window.smoothScrollTo = smoothScrollTo;
window.addFloatingAnimation = addFloatingAnimation;

// CSS for reveal animation (injected dynamically)
const revealStyles = `
    .reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s ease;
    }
    
    .reveal.revealed {
        opacity: 1;
        transform: translateY(0);
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .animate-on-scroll.animated {
        opacity: 1;
        transform: translateY(0);
    }
`;

// Inject styles
const animationStylesheet = document.createElement('style');
animationStylesheet.textContent = revealStyles;
document.head.appendChild(animationStylesheet);

