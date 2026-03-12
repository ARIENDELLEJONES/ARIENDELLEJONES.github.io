/**
 * ============================================
 * POPUP SYSTEM - Fullscreen Event Popup
 * Customizable popup with animations and persistence
 * ============================================
 */

const PopupSystem = {
    /**
     * Initialize popup system
     */
    init: function(config) {
        if (!config || !config.enabled) return;
        
        this.config = config;
        this.popupKey = 'edc_popup_dismissed';
        
        // Check if popup should be shown today
        if (this.shouldShowPopup()) {
            this.showPopup();
        }
    },
    
    /**
     * Check if popup should be shown today
     */
    shouldShowPopup: function() {
        const today = new Date().toDateString();
        const dismissedDate = localStorage.getItem(this.popupKey);
        return dismissedDate !== today;
    },
    
    /**
     * Show the popup
     */
    showPopup: function() {
        const config = this.config;
        
        // Remove existing popup if any
        const existingPopup = document.getElementById('fullscreen-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup HTML
        const popupHTML = `
            <div id="fullscreen-popup" class="popup-overlay">
                <div class="popup-container" style="
                    background: ${config.backgroundColor};
                    color: ${config.textColor};
                ">
                    <button class="popup-close-btn" onclick="PopupSystem.closePopup()" aria-label="Close popup">
                        &times;
                    </button>
                    
                    <div class="popup-inner">
                        ${config.image ? `
                            <div class="popup-image-section">
                                <img src="${config.image}" alt="Popup Image" 
                                     class="popup-image"
                                     onerror="this.style.display='none'; this.parentElement.style.display='none';">
                            </div>
                        ` : ''}
                        
                        <div class="popup-content-section">
                            <h2 class="popup-title" style="color: ${config.textColor};">${config.title}</h2>
                            <p class="popup-description">${config.description}</p>
                            
                            ${config.buttonText && config.buttonLink ? `
                                <a href="${config.buttonLink}" 
                                   class="popup-action-btn" 
                                   style="background: ${config.buttonColor};">
                                    ${config.buttonText}
                                </a>
                            ` : ''}
                            
                            <div class="popup-options">
                                <label class="popup-checkbox">
                                    <input type="checkbox" id="popup-hide-today">
                                    <span>Do not show again today</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add popup to body
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        // Trigger animation
        setTimeout(() => {
            const popup = document.getElementById('fullscreen-popup');
            if (popup) {
                popup.classList.add('popup-active');
            }
        }, 50);
        
        // Add keyboard listener for Escape
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    },
    
    /**
     * Handle keyboard events
     */
    handleKeydown: function(e) {
        if (e.key === 'Escape') {
            this.closePopup();
        }
    },
    
    /**
     * Close the popup
     */
    closePopup: function() {
        const popup = document.getElementById('fullscreen-popup');
        if (!popup) return;
        
        // Add closing class for animation
        popup.classList.remove('popup-active');
        popup.classList.add('popup-closing');
        
        // Check if "do not show again" is checked
        const dontShowCheckbox = document.getElementById('popup-hide-today');
        if (dontShowCheckbox && dontShowCheckbox.checked) {
            this.setDismissedToday();
        }
        
        // Remove from DOM after animation
        setTimeout(() => {
            popup.remove();
            document.removeEventListener('keydown', this.handleKeydown.bind(this));
        }, 400);
    },
    
    /**
     * Set popup as dismissed for today
     */
    setDismissedToday: function() {
        const today = new Date().toDateString();
        localStorage.setItem(this.popupKey, today);
    },
    
    /**
     * Reset popup (show again)
     */
    resetPopup: function() {
        localStorage.removeItem(this.popupKey);
    }
};

// Make globally available
window.PopupSystem = PopupSystem;

// Inject popup styles dynamically
const popupStyles = `
    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.4s ease, visibility 0.4s ease;
        padding: 20px;
    }
    
    .popup-overlay.popup-active {
        opacity: 1;
        visibility: visible;
    }
    
    .popup-overlay.popup-closing {
        opacity: 0;
    }
    
    .popup-container {
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 20px;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        transform: scale(0.9) translateY(20px);
        transition: transform 0.4s ease;
    }
    
    .popup-overlay.popup-active .popup-container {
        transform: scale(1) translateY(0);
    }
    
    .popup-close-btn {
        position: absolute;
        top: 15px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: inherit;
        font-size: 32px;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 10;
    }
    
    .popup-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
    }
    
    .popup-inner {
        display: flex;
        flex-wrap: wrap;
        min-height: 400px;
    }
    
    .popup-image-section {
        flex: 1;
        min-width: 300px;
        position: relative;
        overflow: hidden;
    }
    
    .popup-image-section:first-child .popup-container:first-child {
        border-radius: 20px 0 0 20px;
    }
    
    .popup-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        min-height: 400px;
    }
    
    .popup-content-section {
        flex: 1;
        min-width: 300px;
        padding: 50px 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    
    .popup-title {
        font-size: 2rem;
        margin-bottom: 20px;
        line-height: 1.2;
    }
    
    .popup-description {
        font-size: 1.1rem;
        line-height: 1.7;
        margin-bottom: 30px;
        opacity: 0.9;
    }
    
    .popup-action-btn {
        display: inline-block;
        padding: 15px 35px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 30px;
        text-decoration: none;
        text-align: center;
        transition: all 0.3s ease;
        align-self: flex-start;
    }
    
    .popup-action-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
    
    .popup-options {
        margin-top: 25px;
    }
    
    .popup-checkbox {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 0.9rem;
        opacity: 0.8;
    }
    
    .popup-checkbox input {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }
    
    /* Mobile styles */
    @media (max-width: 768px) {
        .popup-inner {
            flex-direction: column;
        }
        
        .popup-image-section {
            min-height: 200px;
        }
        
        .popup-image {
            min-height: 200px;
        }
        
        .popup-content-section {
            padding: 30px 25px;
        }
        
        .popup-title {
            font-size: 1.5rem;
        }
        
        .popup-description {
            font-size: 1rem;
        }
        
        .popup-close-btn {
            top: 10px;
            right: 10px;
            width: 35px;
            height: 35px;
            font-size: 24px;
        }
    }
`;

// Inject styles
const popupStylesheet = document.createElement('style');
popupStylesheet.textContent = popupStyles;
document.head.appendChild(popupStylesheet);

