# EDC,LTD Full Deployment: GitHub Pages Frontend + Ubuntu Backend

## 📋 Status: Implementation Started ✅
**Current Progress:** Created detailed deployment guide. Completed 2/12 steps.

## 🎯 WHAT I DID (Completed Steps)

**✅ Step 1: Project Analysis (Done)**
- Confirmed repo: https://github.com/ARIENDELLEJONES/ARIENDELLEJONES.github.io (user pages)
- Frontend static-ready (index.html/css/js/images/data), API fallback to static JSON/localStorage
- Backend Node/Express@3000, deps express/cors/multer/fs-extra, APIs /api/config /api/upload
- Git state: main ahead 36 commits, merge conflict TODO.md, untracked deploy-ubuntu.sh/zip
- EC2: ubuntu@54.252.186.9, key C:/Users/ACER/Downloads/eduhire-new-key2.pem

**✅ Step 2: Created Detailed TODO.md (Current File)**
- Full step-by-step for GitHub Pages + Ubuntu deploy
- Nginx config template ready
- JS API updates identified (load-site.js has fallback, image-uploader/admin-editor need /api/ -> EC2)

## 🚀 WHAT TO DO NEXT (Remaining Steps)

**⏳ Step 3: Fix Git Repo & Update JS for EC2 Backend (3 subtasks)**
```
git add .
git commit -m "Resolve merge, add deploy files, prep for Pages"
git push origin main
```
- Edit js files: Add `const API_BASE = 'http://54.252.186.9/api';` replace fetch('/api/..') 
  - js/load-site.js (already fallback-safe)
  - js/image-uploader.js (add ImageUploader.uploadImage to use API_BASE)
  - js/admin-editor.js (loadConfig fetch)

**⏳ Step 4: GitHub Pages Setup**
```
# Repo Settings > Pages > Source: GitHub Actions or main (/) root
# Live URL: https://ARIENDELLEJONES.github.io/ARIENDELLEJONES.github.io/
```

**⏳ Step 5: Ubuntu Backend Deploy (SSH Commands)**
```
ssh -i "C:\Users\ACER\Downloads\eduhire-new-key2.pem" ubuntu@54.252.186.9

# Server Prep (run once)
sudo apt update && sudo apt install -y nodejs npm nginx
sudo npm i -g pm2

# Clone & Install
git clone https://github.com/ARIENDELLEJONES/ARIENDELLEJONES.github.io.git /var/www/edc
cd /var/www/edc/backend
npm install

# PM2 Start
pm2 start server.js --name edc-api
pm2 save
pm2 startup

# Nginx Config (create /etc/nginx/sites-available/edc)
```
```
server {
    listen 80;
    server_name 54.252.186.9;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend Static (GitHub Pages primary, fallback)
    location / {
        root /var/www/edc;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```
```
sudo ln -sf /etc/nginx/sites-available/edc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

**⏳ Step 6: Test Backend**
```
curl http://54.252.186.9/api/config
curl -X POST http://54.252.186.9/api/config -H "Content-Type: application/json" -d '{"test":1}'
```

**⏳ Step 7: Test Full Site**
- Frontend: https://ARIENDELLEJONES.github.io/ARIENDELLEJONES.github.io/ (fetches EC2 API)
- Backend: http://54.252.186.9/
- Admin: http://54.252.186.9/admin.html

**⏳ Step 8: Production Polish (Optional)**
```
# SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 54.252.186.9

# Security Group: Open TCP 80/443 (AWS EC2)
# Domain: Point A record to 54.252.186.9
```

## 🔍 Quick Verification Commands
```
# Local test
cd backend && npm start  # Kill Ctrl+C

# Remote test
ssh ubuntu@54.252.186.9 'curl localhost:3000/api/config'
pm2 logs edc-api  # View logs
pm2 restart edc-api
```

## ⚠️ Prerequisites
- EC2 Security Group: TCP 80/3000/443 inbound (0.0.0.0/0)
- SSH Key: C:\Users\ACER\Downloads\eduhire-new-key2.pem (chmod 400 on server)
- GitHub Token (optional for admin publish)

## 📈 Expected Results
- ✅ GitHub Pages: https://ARIENDELLEJONES.github.io/ARIENDELLEJONES.github.io/
- ✅ Backend API: http://54.252.186.9/api/config
- ✅ Full Site: http://54.252.186.9/ (Nginx serves static+proxy API)

**Next Action:** Execute Step 3 (git push). Reply \"proceed\" to auto-edit JS files & git commit/push.
