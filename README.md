# EDC,LTD – Visual CMS Website Builder (Backend Edition)

[![Backend Status](https://img.shields.io/badge/Backend-✅_Live-brightgreen)](http://localhost:3000)

## 🎯 Overview
**Static → Dynamic CMS Backend**
- **Frontend**: GitHub Pages/static hosting (no change).
- **Backend**: EC2 server (new API for config/images).
- **Flow**: Admin edits → API saves → instant site update.

## 🚀 Quick Start (Local)

### 1. Install & Run Backend
```bash
cd backend
npm install
node server.js
```
**URLs:**
- Site: http://localhost:3000/index.html
- Admin: http://localhost:3000/admin.html ← **Works immediately!**

### 2. Test APIs
```bash
# Get config
curl http://localhost:3000/api/config

# Update config
curl -X POST -H "Content-Type: application/json" \
  -d '{"site":{"name":"Updated EDC"}}' \
  http://localhost:3000/api/config

# Upload image
curl -X POST -F "image=@image.jpg" \
  http://localhost:3000/api/upload
```

## 📁 Project Structure (Updated)
```
EDC,LTD/
├── index.html             # 🎯 Frontend (GitHub Pages ready)
├── admin.html             # 🎛️ Visual CMS Admin
├── data/
│   └── site-config.json   # 📄 Single source of truth
├── js/                    # Scripts (API-integrated)
│   ├── admin-editor.js
│   ├── image-uploader.js
│   └── load-site.js
├── css/
├── images/
│   └── uploads/           # 🖼️ API uploads (auto-created)
└── backend/               # 🚀 Node.js API (NEW)
    ├── server.js
    ├── package.json
    ├── routes/            # /api/config, /api/upload
    ├── controllers/
    └── middleware/
```

## ✅ Verified Test Flow
1. **Server start** → Static files + API ready.
2. **Site load** → `load-site.js` fetches `/api/config`.
3. **Admin edit** → `admin-editor.js` POST `/api/config`.
4. **Image upload** → `image-uploader.js` POST `/api/upload` → `images/uploads/`.
5. **Refresh site** → Changes live (no git/deploy).

## ☁️ EC2 Production Deploy (Detailed)
### Step 1: Prepare Server (Ubuntu)
```bash
sudo apt update
sudo apt install nginx nodejs npm git
sudo npm i -g pm2
```

### Step 2: Upload Files
```bash
git clone YOUR_REPO /var/www/edc
cd /var/www/edc/backend
npm install
```

### Step 3: Run Backend
```bash
pm2 start server.js --name edc-api
pm2 save
pm2 startup  # Auto-start on reboot
```

### Step 4: Nginx Config (`/etc/nginx/sites-available/edc`)
```
server {
  listen 80;
  server_name yourdomain.com;

  # API → Backend
  location /api/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # Static files → Nginx
  location / {
    root /var/www/edc;
    index index.html;
    try_files $uri $uri/ /index.html;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/edc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### Step 5: SSL (Certbot)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔧 Frontend/GitHub Workflow (No Change)
1. **Static hosting**: GitHub Pages (push frontend changes).
2. **Dynamic**: EC2 backend (admin/API).
3. **Sync**: Manual git for static assets or future auto-publish.

## 🛠️ Troubleshooting
| Issue | Solution |
|-------|----------|
| `npm &&` error | Windows: Run `cd backend` + `npm install` separately |
| Admin no save | Check console → API fallback active |
| Images not show | Paths `images/uploads/filename.jpg` absolute? |
| Server crash | `pm2 logs edc-api` |

## 📈 Features Ready
- ✅ Config CRUD (JSON atomic writes)
- ✅ Image upload (10MB, images only)
- ✅ CORS (local/admin)
- ✅ Static serve
- ✅ Error handling
- ✅ EC2 deploy-ready

## 🔮 Next (Planned)
- JS full API integration
- User auth
- GitHub auto-sync
- Form handling

**Backend live! Admin works out-of-box. Deploy-ready.**
