/**
 * ============================================
 * GITHUB PUBLISHER - GitHub API Integration
 * Publishes website files to GitHub Repository
 * ============================================
 */

const GitHubPublisher = {
    config: null,
    
    /**
     * Initialize with configuration
     */
    init: function(config) {
        this.config = config;
    },
    
    /**
     * Update configuration
     */
    setConfig: function(config) {
        this.config = config;
    },
    
    /**
     * Extract owner and repo from URL
     */
    parseRepoUrl: function(url) {
        // Handle various GitHub URL formats
        // https://github.com/username/repo
        // github.com/username/repo
        // username/repo
        
        let match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            return {
                owner: match[1],
                repo: match[2].replace(/\.git$/, '')
            };
        }
        
        match = url.match(/^([^\/]+)\/([^\/]+)$/);
        if (match) {
            return {
                owner: match[1],
                repo: match[2]
            };
        }
        
        return null;
    },
    
    /**
     * Get file SHA for updating existing files
     */
    getFileSHA: async function(owner, repo, path, branch) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null; // File doesn't exist, will create new
                }
                throw new Error(`Failed to get file SHA: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.sha;
        } catch (error) {
            console.error('Error getting file SHA:', error);
            return null;
        }
    },
    
    /**
     * Upload/update file to GitHub
     */
    uploadFile: async function(owner, repo, path, content, branch, message, isBinary = false) {
        // Get existing file SHA if file exists
        const sha = await this.getFileSHA(owner, repo, path, branch);
        
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        // GitHub always expects base64 content, no need to re-encode
        const body = {
            message: message,
            content: content,  // Already base64 from publish()
            branch: branch
        };
        
        // Include SHA if updating existing file
        if (sha) {
            body.sha = sha;
            console.log(`Updating existing file: ${path} (SHA: ${sha})`);
        } else {
            console.log(`Creating new file: ${path}`);
        }
        
        console.log(`Uploading to GitHub: ${path}`);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(`${errorMsg} (path: ${path})`);
        }
        
        const result = await response.json();
        console.log(`✅ GitHub API success: ${path} -> ${result.content.html_url}`);
        return result;
    },

    
    /**
     * Read file content from input
     * Returns {content: string, isBinary: boolean}
     */
    readFileContent: async function(filePath) {
        try {
            // Handle site-config.json specially - remove sensitive data before publishing
            if (filePath.includes('site-config.json')) {
                // Try to get from localStorage first (has latest changes)
                const backup = localStorage.getItem('edc_config_backup');
                if (backup) {
                    let config = JSON.parse(backup);
                    // Remove sensitive GitHub credentials before publishing
                    if (config.github) {
                        config.github = {
                            repoUrl: config.github.repoUrl || '',
                            branch: config.github.branch || 'main',
                            username: config.github.username || '',
                            token: ''  // Don't publish the token!
                        };
                    }
                    const content = JSON.stringify(config, null, 4);
                    return { content, isBinary: false };
                }
                // Otherwise fetch from file
                const res = await fetch('data/site-config.json');
                const data = await res.json();
                // Remove sensitive GitHub credentials before publishing
                if (data.github) {
                    data.github.token = '';
                }
                const content = JSON.stringify(data, null, 4);
                return { content, isBinary: false };
            } else if (filePath.includes('images/uploads/')) {
                // Handle image files - read as base64
                console.log(`Fetching image: ${filePath}`);
                const res = await fetch(filePath);
                if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
                const blob = await res.blob();
                const dataUrl = await new Promise((resolveBlob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolveBlob(reader.result);
                    reader.readAsDataURL(blob);
                });
                // Return the base64 data (without the data:image/xxx;base64, prefix)
                const base64 = dataUrl.split(',')[1];
                const sizeKB = Math.round((base64.length * 3 / 4) / 1024);
                console.log(`Image loaded: ${filePath} (${sizeKB}KB)`);
                if (sizeKB > 1000) {
                    console.warn(`Large image warning: ${filePath} (${sizeKB}KB) - GitHub limit is ~1MB`);
                }
                return { content: base64, isBinary: true };
            } else {
                // For CSS, HTML, other text files
                console.log(`Fetching text file: ${filePath}`);
                const res = await fetch(filePath);
                if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
                const content = await res.text();
                console.log(`Text file loaded: ${filePath}`);
                return { content, isBinary: false };
            }
        } catch (error) {
            console.error(`readFileContent error for ${filePath}:`, error);
            throw error;
        }
    },

    
    /**
     * Publish website to GitHub
     */
    publish: async function(files, onProgress, onComplete, onError) {
        if (!this.config || !this.config.repoUrl || !this.config.token) {
            onError('GitHub configuration is missing');
            return;
        }
        
        const repoInfo = this.parseRepoUrl(this.config.repoUrl);
        if (!repoInfo) {
            onError('Invalid GitHub repository URL');
            return;
        }
        
        const { owner, repo } = repoInfo;
        const branch = this.config.branch || 'main';
        
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                onProgress(`Uploading ${file.path}... (${i + 1}/${files.length})`);
                
                const { content, isBinary } = await this.readFileContent(file.path);
                
                let base64Content;
                if (isBinary) {
                    // Use clean base64 directly (images)
                    base64Content = content;
                    console.log(`Using binary base64 directly: ${file.path}`);
                } else {
                    // Text files: proper UTF-8 encoding
                    base64Content = btoa(unescape(encodeURIComponent(content)));
                    console.log(`Encoded text file: ${file.path}`);
                }
                
                const result = await this.uploadFile(
                    owner,
                    repo,
                    file.path,
                    base64Content,
                    branch,
                    file.message || `Update ${file.path}`,
                    isBinary
                );
                
                results.push({
                    path: file.path,
                    success: true,
                    url: result.content.html_url
                });
                console.log(`✅ Published: ${file.path}`);
                
            } catch (error) {
                console.error(`❌ Publish failed for ${file.path}:`, error);
                results.push({
                    path: file.path,
                    success: false,
                    error: error.message
                });
                onError(`Error uploading ${file.path}: ${error.message}`);
            }
        }
        
        const allSuccess = results.every(r => r.success);
        if (allSuccess) {
            console.log('🎉 All files published successfully!');
        } else {
            console.log('⚠️ Some files failed to publish');
        }
        onComplete(results);
        
        return results;
    },

    
    /**
     * Test GitHub connection
     */
    testConnection: async function() {
        if (!this.config || !this.config.repoUrl || !this.config.token) {
            return { success: false, message: 'Configuration missing' };
        }
        
        const repoInfo = this.parseRepoUrl(this.config.repoUrl);
        if (!repoInfo) {
            return { success: false, message: 'Invalid repository URL' };
        }
        
        const { owner, repo } = repoInfo;
        
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    return { success: false, message: 'Invalid or expired token' };
                }
                if (response.status === 404) {
                    return { success: false, message: 'Repository not found' };
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return { 
                success: true, 
                message: 'Connected successfully',
                repo: data
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Get repository info
     */
    getRepoInfo: async function() {
        if (!this.config || !this.config.repoUrl) {
            return null;
        }
        
        const repoInfo = this.parseRepoUrl(this.config.repoUrl);
        if (!repoInfo) return null;
        
        const { owner, repo } = repoInfo;
        
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }
};

// Make globally available
window.GitHubPublisher = GitHubPublisher;

// Default files to publish
window.getDefaultPublishFiles = function() {
    return [
        { path: 'index.html', message: 'Update index.html' },
        { path: 'data/site-config.json', message: 'Update site configuration' },
        { path: 'css/style.css', message: 'Update styles' }
    ];
};

