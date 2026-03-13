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
    uploadFile: async function(owner, repo, path, content, branch, message, isBase64 = true) {
        // Get existing file SHA if file exists
        const sha = await this.getFileSHA(owner, repo, path, branch);
        
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        const body = {
            message: message,
            content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
            branch: branch
        };
        
        // Include SHA if updating existing file
        if (sha) {
            body.sha = sha;
        }
        
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
            const error = await response.json();
            throw new Error(error.message || `Failed to upload file: ${response.statusText}`);
        }
        
        return await response.json();
    },
    
    /**
     * Read file content from input
     */
    readFileContent: function(filePath) {
        return new Promise((resolve, reject) => {
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
                    resolve(JSON.stringify(config, null, 4));
                    return;
                }
                // Otherwise fetch from file
                fetch('data/site-config.json')
                    .then(res => res.json())
                    .then(data => {
                        // Remove sensitive GitHub credentials before publishing
                        if (data.github) {
                            data.github.token = '';
                        }
                        resolve(JSON.stringify(data, null, 4));
                    })
                    .catch(reject);
            } else if (filePath.includes('images/uploads/')) {
                // Handle image files - read as base64
                fetch(filePath)
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to fetch image');
                        return res.blob();
                    })
                    .then(blob => {
                        return new Promise((resolveBlob) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolveBlob(reader.result);
                            reader.readAsDataURL(blob);
                        });
                    })
                    .then(dataUrl => {
                        // Return the base64 data (without the data:image/xxx;base64, prefix)
                        const base64 = dataUrl.split(',')[1];
                        resolve(base64);
                    })
                    .catch(reject);
            } else if (filePath.includes('style.css')) {
                fetch('css/style.css')
                    .then(res => res.text())
                    .then(resolve)
                    .catch(reject);
            } else {
                // For index.html or other files
                fetch(filePath)
                    .then(res => res.text())
                    .then(resolve)
                    .catch(reject);
            }
        });
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
                
                const content = await this.readFileContent(file.path);
                const base64Content = btoa(unescape(encodeURIComponent(content)));
                
                const result = await this.uploadFile(
                    owner,
                    repo,
                    file.path,
                    base64Content,
                    branch,
                    file.message || `Update ${file.path}`
                );
                
                results.push({
                    path: file.path,
                    success: true,
                    url: result.content.html_url
                });
                
            } catch (error) {
                results.push({
                    path: file.path,
                    success: false,
                    error: error.message
                });
                onError(`Error uploading ${file.path}: ${error.message}`);
            }
        }
        
        const allSuccess = results.every(r => r.success);
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

