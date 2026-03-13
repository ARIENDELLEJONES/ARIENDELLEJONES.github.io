
/**
 * ============================================
 * IMAGE UPLOADER - Local Image Upload Handler
 * Handles image uploads for GitHub Pages admin panel
 * Images are saved locally and paths stored in JSON
 * ============================================
 */

const ImageUploader = {
    // Configuration
    uploadsFolder: 'images/uploads/',
    
    /**
     * Generate a unique filename with timestamp
     * @param {File} file - The uploaded file
     * @param {string} section - Section name (hero, team, gallery, etc.)
     * @returns {string} Unique filename
     */
    generateUniqueFilename: function(file, section) {
        const timestamp = Date.now();
        const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const extension = file.name.split('.').pop().toLowerCase();
        const safeName = originalName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        return `${section}-${safeName}-${timestamp}.${extension}`;
    },
    
    /**
     * Get the relative path for storing in JSON config
     * @param {string} filename - The filename
     * @returns {string} Relative path for JSON
     */
    getImagePath: function(filename) {
        return this.uploadsFolder + filename;
    },
    
    /**
     * Preview an image before uploading
     * @param {File} file - The file to preview
     * @param {Function} callback - Callback with base64 data URL
     */
    previewImage: function(file, callback) {
        if (!file || !file.type.startsWith('image/')) {
            console.error('Invalid file type');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.onerror = function() {
            console.error('Error reading file');
        };
        reader.readAsDataURL(file);
    },
    
    /**
     * Create an image preview element
     * @param {string} src - Image source (base64 or path)
     * @param {string} alt - Alt text
     * @param {number} maxWidth - Max width for preview
     * @returns {HTMLElement} Image element
     */
    createPreviewElement: function(src, alt, maxWidth = 150) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt || 'Preview';
        img.style.maxWidth = maxWidth + 'px';
        img.style.maxHeight = '100px';
        img.style.marginTop = '10px';
        img.style.borderRadius = '4px';
        img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        return img;
    },
    
    /**
     * Create a file input with preview for admin panel
     * @param {string} section - Section name (hero, intro, popup, team, gallery, client)
     * @param {number} index - Index for array items (team, gallery, client)
     * @param {string} currentValue - Current image path or base64
     * @param {Function} onChange - Callback when image is selected
     * @returns {string} HTML string
     */
    createImageInput: function(section, index, currentValue, onChange) {
        const inputId = `image-input-${section}-${index || 0}`;
        const previewId = `image-preview-${section}-${index || 0}`;
        
        // Determine if current value is a path or base64
        let previewHtml = '';
        if (currentValue && !currentValue.startsWith('data:')) {
            previewHtml = `<img id="${previewId}" src="${currentValue}" alt="Current" style="max-width:150px;max-height:100px;margin-top:10px;border-radius:4px;">`;
        }
        
        return `
            <div class="image-upload-container" style="margin-bottom: 15px;">
                <input type="file" 
                       id="${inputId}" 
                       accept="image/*" 
                       data-section="${section}" 
                       data-index="${index || 0}"
                       onchange="ImageUploader.handleFileSelect(this)"
                       style="margin-bottom: 8px;">
                <div class="image-preview-area" id="preview-${section}-${index || 0}">
                    ${previewHtml}
                </div>
                <div class="upload-instructions" style="font-size: 12px; color: #666; margin-top: 5px;">
                    <strong>Workflow:</strong> Select image → Preview → Save Config → 
                    <span style="color: #e67e22;">Download Image</span> → 
                    Copy to <code>images/uploads/</code> → Commit to GitHub
                </div>
            </div>
        `;
    },
    
    /**
     * Handle file selection from input
     * @param {HTMLInputElement} input - The file input element
     */
    handleFileSelect: function(input) {
        const file = input.files[0];
        if (!file) return;
        
        const section = input.dataset.section;
        const index = parseInt(input.dataset.index);
        const previewArea = input.parentElement.querySelector('.image-preview-area');
        
        // Preview the image
        this.previewImage(file, function(dataUrl) {
            // Clear previous preview
            previewArea.innerHTML = '';
            
            // Create preview image
            const img = ImageUploader.createPreviewElement(dataUrl, 'Preview');
            img.id = `preview-img-${section}-${index}`;
            previewArea.appendChild(img);
            
            // Store filename for later use
            const filename = ImageUploader.generateUniqueFilename(file, section);
            input.dataset.generatedFilename = filename;
            input.dataset.previewData = dataUrl;
            
            // Show download button
            ImageUploader.showDownloadButton(previewArea, dataUrl, filename);
        });
    },
    
    /**
     * Show download button for the uploaded image
     * @param {HTMLElement} container - Container element
     * @param {string} dataUrl - Base64 image data
     * @param {string} filename - Filename for download
     */
    showDownloadButton: function(container, dataUrl, filename) {
        // Remove existing download button
        const existingBtn = container.parentElement.querySelector('.download-image-btn');
        if (existingBtn) existingBtn.remove();
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-secondary download-image-btn';
        btn.innerHTML = '<span>📥</span> Download Image for Upload';
        btn.style.marginTop = '10px';
        btn.onclick = function() {
            ImageUploader.downloadImage(dataUrl, filename);
        };
        
        container.parentElement.appendChild(btn);
    },
    
    /**
     * Download image for manual upload to folder
     * @param {string} dataUrl - Base64 image data
     * @param {string} filename - Filename to save as
     */
    downloadImage: function(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show instructions
        alert(`Image downloaded as: ${filename}\n\n` +
              'Next steps:\n' +
              '1. Copy this file to: images/uploads/\n' +
              '2. Save the config (click "Save Changes")\n' +
              '3. Commit changes to GitHub:\n' +
              '   git add .\n' +
              '   git commit -m "Add uploaded images"\n' +
              '   git push origin master');
    },
    
    /**
     * Get the path that should be saved in JSON config
     * @param {HTMLInputElement} input - The file input element
     * @returns {string} Relative path for JSON (images/uploads/filename)
     */
    getPathForConfig: function(input) {
        if (input.files && input.files[0]) {
            return this.uploadsFolder + input.dataset.generatedFilename;
        }
        return input.value; // Fallback to existing value
    },
    
    /**
     * Update image field with path after download
     * @param {string} section - Section name
     * @param {number} index - Index
     * @param {string} path - Image path
     */
    updateConfigField: function(section, index, path) {
        // This will be called by AdminEditor after download
        console.log(`Image path for ${section}[${index}]: ${path}`);
    },
    
/**
     * Validate image file
     * @param {File} file - File to validate
     * @returns {Object} Validation result {valid: boolean, message: string}
     */
    validateFile: function(file) {
        // Check if file exists
        if (!file) {
            return { valid: false, message: 'No file selected' };
        }
        
        // Check file type - support ALL image types
        const validTypes = [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'image/bmp',
            'image/tiff',
            'image/svg+xml',
            'image/heic',
            'image/heif',
            'image/avif',
            'image/x-icon'
        ];
        
        if (!validTypes.includes(file.type)) {
            return { valid: false, message: 'Invalid file type. Supported: JPG, PNG, GIF, WebP, BMP, TIFF, SVG, HEIC, HEIF, AVIC, ICO' };
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return { valid: false, message: 'File too large. Maximum size is 10MB' };
        }
        
        return { valid: true, message: 'Valid file' };
    },
    
    /**
     * Get file extension from MIME type
     * @param {string} mimeType - MIME type
     * @returns {string} File extension
     */
    getExtensionFromMime: function(mimeType) {
        const mimeMap = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff',
            'image/svg+xml': 'svg',
            'image/heic': 'heic',
            'image/heif': 'heif',
            'image/avif': 'avif',
            'image/x-icon': 'ico'
        };
        return mimeMap[mimeType] || 'jpg';
    },
    
    /**
     * Show upload actions: Crop, Download, Delete
     * @param {HTMLInputElement} input - The file input element
     * @param {string} dataUrl - Base64 image data
     * @param {string} filename - Generated filename
     * @param {string} relativePath - Relative path for config
     * @param {string} configPath - Config path for update
     */
    showUploadActions: function(input, dataUrl, filename, relativePath, configPath) {
        const container = input.parentElement;
        
        // Remove existing instructions
        const existingInstructions = container.querySelector('.upload-instructions-box');
        if (existingInstructions) existingInstructions.remove();
        
        const instructionsBox = document.createElement('div');
        instructionsBox.className = 'upload-instructions-box';
        instructionsBox.style.cssText = 'background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin-top: 10px;';
        
        // Create action buttons
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;';
        
        // Crop button
        const cropBtn = document.createElement('button');
        cropBtn.type = 'button';
        cropBtn.className = 'btn btn-primary';
        cropBtn.innerHTML = '✂️ Crop Image';
        cropBtn.onclick = function() {
            ImageUploader.openCropper(dataUrl, filename, relativePath, configPath, input);
        };
        
        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.className = 'btn btn-warning';
        downloadBtn.innerHTML = '📥 Download';
        downloadBtn.onclick = function() {
            ImageUploader.downloadImage(dataUrl, filename);
            downloadBtn.innerHTML = '✅ Downloaded!';
            downloadBtn.disabled = true;
        };
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.innerHTML = '🗑️ Remove';
        deleteBtn.onclick = function() {
            if (confirm('Remove this image?')) {
                ImageUploader.removeImage(input, relativePath, configPath);
            }
        };
        
        buttonRow.appendChild(cropBtn);
        buttonRow.appendChild(downloadBtn);
        buttonRow.appendChild(deleteBtn);
        
        // Instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = 'font-size: 12px; color: #666;';
        instructions.innerHTML = `
            <strong>Instructions:</strong><br>
            1. 📷 <strong>Crop</strong> - Edit image before downloading<br>
            2. 📥 <strong>Download</strong> - Save to images/uploads/<br>
            3. 💾 <strong>Save Changes</strong> in admin panel<br>
            4. 🌐 <strong>Publish</strong> to GitHub
        `;
        
        instructionsBox.appendChild(buttonRow);
        instructionsBox.appendChild(instructions);
        
        container.appendChild(instructionsBox);
        
        // Store data for later use
        input.dataset.previewData = dataUrl;
        input.dataset.generatedFilename = filename;
        input.dataset.relativePath = relativePath;
    },
    
    /**
     * Open cropper modal
     * @param {string} dataUrl - Base64 image data
     * @param {string} filename - Original filename
     * @param {string} relativePath - Relative path
     * @param {string} configPath - Config path
     * @param {HTMLInputElement} input - Input element
     */
    openCropper: function(dataUrl, filename, relativePath, configPath, input) {
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'cropper-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;justify-content:center;align-items:center;flex-direction:column;';
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background:white;padding:20px;border-radius:8px;max-width:95%;max-height:95%;overflow:auto;';
        
        const title = document.createElement('h3');
        title.textContent = '✂️ Crop & Resize Image';
        title.style.marginTop = '0';
        
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = 'max-width:100%;max-height:50vh;overflow:hidden;margin:15px 0;';
        
        const img = document.createElement('img');
        img.src = dataUrl;
        img.id = 'cropper-image';
        img.style.cssText = 'max-width:100%;max-height:50vh;';
        
        imgContainer.appendChild(img);
        
        // Crop controls
        const controls = document.createElement('div');
        controls.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:15px;padding:10px;background:#f5f5f5;border-radius:8px;';
        controls.innerHTML = `
            <div>
                <label style="display:block;font-size:12px;margin-bottom:5px;">Width (px)</label>
                <input type="number" id="crop-width" value="800" min="50" max="2000" style="width:100%;padding:8px;">
            </div>
            <div>
                <label style="display:block;font-size:12px;margin-bottom:5px;">Height (px)</label>
                <input type="number" id="crop-height" value="600" min="50" max="2000" style="width:100%;padding:8px;">
            </div>
            <div>
                <label style="display:block;font-size:12px;margin-bottom:5px;">Quality</label>
                <select id="crop-quality" style="width:100%;padding:8px;">
                    <option value="1.0">100% (Best)</option>
                    <option value="0.9" selected>90% (High)</option>
                    <option value="0.8">80% (Medium)</option>
                    <option value="0.7">70% (Low)</option>
                </select>
            </div>
            <div>
                <label style="display:block;font-size:12px;margin-bottom:5px;">Format</label>
                <select id="crop-format" style="width:100%;padding:8px;">
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                </select>
            </div>
        `;
        
        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-top:15px;';
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = '✓ Apply Crop';
        applyBtn.className = 'btn btn-primary';
        applyBtn.onclick = function() { 
            ImageUploader.applyCrop(img, filename, relativePath, configPath, input, modal); 
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✕ Cancel';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.onclick = function() { modal.remove(); };
        
        buttonGroup.appendChild(applyBtn);
        buttonGroup.appendChild(cancelBtn);
        
        modalContent.appendChild(title);
        modalContent.appendChild(controls);
        modalContent.appendChild(imgContainer);
        modalContent.appendChild(buttonGroup);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    },
    
    /**
     * Apply crop to image
     * @param {HTMLImageElement} img - Image element
     * @param {string} filename - Original filename
     * @param {string} relativePath - Relative path
     * @param {string} configPath - Config path
     * @param {HTMLInputElement} input - Input element
     * @param {HTMLElement} modal - Modal element
     */
    applyCrop: function(img, filename, relativePath, configPath, input, modal) {
        const targetWidth = parseInt(document.getElementById('crop-width').value) || 800;
        const targetHeight = parseInt(document.getElementById('crop-height').value) || 600;
        const quality = parseFloat(document.getElementById('crop-quality').value) || 0.9;
        const format = document.getElementById('crop-format').value || 'image/jpeg';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate crop to fill the target dimensions (like object-fit: cover)
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = targetWidth / targetHeight;
        
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        
        if (imgRatio > targetRatio) {
            // Image is wider - crop sides
            sw = img.naturalHeight * targetRatio;
            sx = (img.naturalWidth - sw) / 2;
        } else {
            // Image is taller - crop top/bottom
            sh = img.naturalWidth / targetRatio;
            sy = (img.naturalHeight - sh) / 2;
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw cropped and resized image
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        
        // Get cropped data
        const croppedData = canvas.toDataURL(format, quality);
        
        // Get new extension
        const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
        const newFilename = filename.replace(/\.[^/.]+$/, '') + '-cropped.' + ext;
        
        // Update input data
        input.dataset.previewData = croppedData;
        input.dataset.generatedFilename = newFilename;
        input.dataset.relativePath = 'images/uploads/' + newFilename;
        
        // Update path input
        const uniqueId = input.id.replace('image-file-', '');
        const pathInput = document.getElementById('image-path-' + uniqueId);
        if (pathInput) {
            pathInput.value = 'images/uploads/' + newFilename;
            pathInput.dispatchEvent(new Event('change'));
        }
        
        // Update preview
        const previewContainer = document.getElementById('preview-container-' + uniqueId);
        if (previewContainer) {
            previewContainer.innerHTML = '';
            const previewImg = document.createElement('img');
            previewImg.src = croppedData;
            previewImg.style.cssText = 'max-width:150px;max-height:100px;margin-top:10px;border-radius:4px;border:2px solid #28a745;';
            previewContainer.appendChild(previewImg);
        }
        
        // Close modal
        modal.remove();
        
        // Show success and re-show actions
        alert('Image cropped! New size: ' + targetWidth + 'x' + targetHeight + 'px\nClick Download to save.');
        
        // Re-show the action buttons with cropped data
        this.showUploadActions(input, croppedData, newFilename, 'images/uploads/' + newFilename, configPath);
    },
    
    /**
     * Remove image from config
     * @param {HTMLInputElement} input - Input element
     * @param {string} relativePath - Relative path
     * @param {string} configPath - Config path
     */
    removeImage: function(input, relativePath, configPath) {
        // Clear the path input
        const uniqueId = input.id.replace('image-file-', '');
        const pathInput = document.getElementById('image-path-' + uniqueId);
        if (pathInput) {
            pathInput.value = '';
            pathInput.dispatchEvent(new Event('change'));
        }
        
        // Clear preview
        const previewContainer = document.getElementById('preview-container-' + uniqueId);
        if (previewContainer) {
            previewContainer.innerHTML = '<p style="color:#999;font-size:12px;">No image selected</p>';
        }
        
        // Clear input
        input.value = '';
        
        // Remove instructions box
        const container = input.parentElement;
        const instructionsBox = container.querySelector('.upload-instructions-box');
        if (instructionsBox) instructionsBox.remove();
        
        // Show removed message
        alert('Image removed! Click Save Changes to apply.');
    },
    
    /**
     * Create a complete image editor component for admin panel
     * @param {string} label - Field label
     * @param {string} section - Section name
     * @param {number} index - Index for array items
     * @param {string} currentPath - Current image path
     * @param {string} configPath - Dot notation path for config update
     * @returns {string} HTML string
     */
    createImageEditor: function(label, section, index, currentPath, configPath) {
        const uniqueId = `${section}-${index || 0}`;
        
        let previewHtml = '';
        if (currentPath) {
            if (currentPath.startsWith('data:')) {
                previewHtml = `<img src="${currentPath}" alt="Current" style="max-width:150px;max-height:100px;margin-top:10px;border-radius:4px;" class="current-image-preview">`;
            } else {
                previewHtml = `<img src="${currentPath}" alt="Current" style="max-width:150px;max-height:100px;margin-top:10px;border-radius:4px;" class="current-image-preview" onerror="this.style.display='none'">`;
            }
        }
        
        return `
            <div class="form-group image-editor-group">
                <label>${label}</label>
                <div class="image-editor-wrapper">
                    <input type="text" 
                           id="image-path-${uniqueId}" 
                           value="${currentPath || ''}" 
                           placeholder="images/uploads/filename.jpg"
                           onchange="AdminEditor.updateConfig('${configPath}', this.value)"
                           style="flex: 1;">
                    <input type="file" 
                           id="image-file-${uniqueId}" 
                           accept="image/*" 
                           data-section="${section}" 
                           data-index="${index || 0}"
                           data-config-path="${configPath}"
                           onchange="ImageUploader.handleImageUpload(this)"
                           style="margin-top: 5px;">
                    <div id="preview-container-${uniqueId}" class="preview-container">
                        ${previewHtml}
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Handle image upload from the admin panel
     * @param {HTMLInputElement} input - The file input element
     */
    handleImageUpload: function(input) {
        const file = input.files[0];
        if (!file) return;
        
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            alert(validation.message);
            input.value = ''; // Clear input
            return;
        }
        
        const section = input.dataset.section;
        const index = parseInt(input.dataset.index);
        const configPath = input.dataset.configPath;
        const uniqueId = `${section}-${index}`;
        const previewContainer = document.getElementById(`preview-container-${uniqueId}`);
        const pathInput = document.getElementById(`image-path-${uniqueId}`);
        
        // Generate unique filename
        const filename = this.generateUniqueFilename(file, section);
        const relativePath = this.uploadsFolder + filename;
        
        // Preview the image
        this.previewImage(file, function(dataUrl) {
            // Clear and show preview
            if (previewContainer) {
                previewContainer.innerHTML = '';
                const img = ImageUploader.createPreviewElement(dataUrl, 'Preview');
                previewContainer.appendChild(img);
            }
            
            // Update the path input with expected path
            if (pathInput) {
                pathInput.value = relativePath;
                // Trigger change event
                pathInput.dispatchEvent(new Event('change'));
            }
            
            // Store data for download
            input.dataset.previewData = dataUrl;
            input.dataset.generatedFilename = filename;
            input.dataset.relativePath = relativePath;
            
            // Show action buttons (Crop, Download, Delete)
            ImageUploader.showUploadActions(input, dataUrl, filename, relativePath, configPath);
        });
    },
    
    /**
     * Show upload instructions and download button
     * @param {HTMLInputElement} input - The file input element
     * @param {string} dataUrl - Base64 image data
     * @param {string} filename - Generated filename
     * @param {string} relativePath - Relative path for config
     * @param {string} configPath - Config path for update
     */
    showUploadInstructions: function(input, dataUrl, filename, relativePath, configPath) {
        const container = input.parentElement;
        
        // Remove existing instructions
        const existingInstructions = container.querySelector('.upload-instructions-box');
        if (existingInstructions) existingInstructions.remove();
        
        const instructionsBox = document.createElement('div');
        instructionsBox.className = 'upload-instructions-box';
        instructionsBox.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 10px; margin-top: 10px;';
        instructionsBox.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: #856404;">📋 Follow these steps:</strong>
            </div>
            <ol style="margin: 0; padding-left: 20px; color: #856404; font-size: 13px;">
                <li style="margin-bottom: 5px;">Click "Download Image" button below</li>
                <li style="margin-bottom: 5px;">Save the image to: <code style="background: #fff; padding: 2px 5px;">images/uploads/${filename}</code></li>
                <li style="margin-bottom: 5px;">Click "Save Changes" in admin panel</li>
                <li style="margin-bottom: 5px;">Push to GitHub to see image on live site</li>
            </ol>
            <button type="button" class="btn btn-warning" onclick="ImageUploader.downloadForUpload(this, '${dataUrl}', '${filename}')" 
                    style="margin-top: 10px; width: 100%;">
                <span>📥</span> Download Image to Upload
            </button>
        `;
        
        container.appendChild(instructionsBox);
    },
    
    /**
     * Download image for manual upload
     * @param {HTMLElement} button - The button element
     * @param {string} dataUrl - Base64 image data
     * @param {string} filename - Filename to save as
     */
    downloadForUpload: function(button, dataUrl, filename) {
        this.downloadImage(dataUrl, filename);
        
        // Update button to show success
        button.innerHTML = '<span>✅</span> Image Downloaded!';
        button.className = 'btn btn-success';
        button.disabled = true;
    },
    
    /**
     * Get all image paths from config
     * @param {Object} config - Site config object
     * @returns {Array} Array of image info objects
     */
    getAllImagePaths: function(config) {
        const images = [];
        
        // Helper to add image
        const addImage = (path, context) => {
            if (path && !path.startsWith('data:') && !images.find(i => i.path === path)) {
                images.push({ path, context });
            }
        };
        
        // Site logo and favicon
        addImage(config.site?.logo, 'Site Logo');
        addImage(config.site?.favicon, 'Favicon');
        
        // Hero
        addImage(config.hero?.backgroundImage, 'Hero Background');
        
        // Introduction
        addImage(config.introduction?.image, 'Introduction Image');
        
        // Popup
        addImage(config.popup?.image, 'Popup Image');
        
        // Team members
        config.team?.members?.forEach((member, i) => {
            addImage(member.image, `Team Member ${i + 1}: ${member.name}`);
        });
        
        // Gallery
        config.gallery?.images?.forEach((img, i) => {
            addImage(img.src, `Gallery Image ${i + 1}`);
        });
        
        // Clients
        config.clients?.items?.forEach((client, i) => {
            addImage(client.logo, `Client ${i + 1}: ${client.name}`);
        });
        
        return images;
    }
};

    const res = await fetch(`${API_BASE}/upload`, {

