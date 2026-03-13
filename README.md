# EDC,LTD – Visual CMS Website Builder (Full-Stack)

[![Backend Status](https://img.shields.io/badge/Backend-✅_Live-brightgreen)](http://localhost:3000)
[![Frontend](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue)](https://yourusername.github.io/edc-ltd)

## 🎯 Overview
**EDC,LTD** is a modern Visual CMS Website Builder that transforms static sites into dynamic, admin-managed experiences.

### Key Features:
- **Visual Admin Panel** (`admin.html`): Edit site config, upload images via intuitive UI.
- **Dynamic Content**: Single `data/site-config.json` powers the entire site, updated via API.
- **Image Management**: Upload to `images/uploads/` with auto-resizing/preview.
- **Backend API**: Node.js/Express for config CRUD & uploads (`/api/config`, `/api/upload`).
- **Deployment**: Local dev, EC2/Nginx/PM2 production-ready.
- **Frontend**: Pure HTML/CSS/JS, GitHub Pages compatible.

**Flow**: Edit in admin → API saves JSON → Site auto-refreshes with new config/images.

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- Git

### 1. Clone & Setup
```bash
git clone <your-repo> edc-ltd
cd edc-ltd
```

### 2. Backend (API Server)
```bash
cd backend
npm install
npm start  # or node server.js
```
- API: http://localhost:3000/api/config
- Static files served too.

### 3. Frontend Test
Open in browser:
- Site: http://localhost:3000/index.html
- Admin: http://localhost:3000/admin.html

### 4. Test APIs (curl)
```bash
# Get current config
curl http://localhost:3000/api/config

# Update site name
curl -X POST -H "Content-Type: application/json" \
  -d '{"site":{"name":"My Updated Site"}}' \
  http://localhost:3000/api/config

# Upload image (save as test.jpg first)
curl -X POST -F "image=@test.jpg" \
  http://localhost:3000/api/upload

# Check upload
curl http://localhost:3000/images/uploads/test.jpg
```

## 📁 Project Structure
```
EDC,LTD/
├── index.html          # Main landing page
├── navbar.html         # Reusable navbar (loaded via JS)
├── admin.html          # Visual CMS admin panel
├── css/
│   ├── style.css       # Site styles
│   └── admin.css       # Admin panel styles
├── js/                 # Core scripts
│   ├── load-site.js    # Fetches & renders config/images
│   ├── admin-editor.js # Admin config editor (localStorage + API planned)
│   ├── image-uploader.js # Image upload handler
│   ├── animations.js
│   ├── api-config.js
│   ├── navbar-loader.js
│   ├── popup.js
│   └── github-publisher.js # Optional GitHub sync
├── data/
│   └── site-config.json # Dynamic site data (name, hero, gallery, etc.)
├── images/
│   ├── favicon.svg
│   ├── intro.jpg
│   ├── logo.svg
│   ├── gallery/        # Static gallery images
│   └── uploads/        # Dynamic uploads from admin/API (.gitkeep)
├── backend/            # Node.js API
│   ├── controllers/
│   │   ├── configController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── config.js
│   │   └── upload.js
│   └── ... (server.js, package.json)
├── deploy-ubuntu.sh    # One-click Ubuntu deploy script
├── nginx-edc.conf      # Production Nginx config
├── TODO.md             # Pending tasks
└── README.md           # You're reading it!
```

## 🌐 Frontend Deployment (GitHub Pages)
1. Push to `main` branch (exclude `backend/`, `data/` if sensitive).
2. Enable GitHub Pages in Settings > Pages > Source: Deploy from branch `main`.
3. Site live at `https://<username>.github.io/edc-ltd/`.

**Note**: Dynamic features require backend; static fallback via localStorage.

## 🖥️ Admin Panel & Site Workflow (Detailed)

### Core Architecture
**Single JSON Config (`data/site-config.json`)** powers everything:
```
{
  "site": { "name": "...", "logo": "images/logo.svg" },
  "hero": { "title": "...", "backgroundImage": "images/intro.jpg" },
  "team": { "members": [{ "name": "...", "image": "images/uploads/team1.jpg" }] },
  "theme": { "colors": { "primary": "#05234d" } },
  // All sections, GitHub creds, popup...
}
```

**Dual Mode Operation**:
| Mode | Config Source Priority | Best For |
|------|-----------------------|----------|
| **Live Site** (`index.html`) | 1. API (`/api/config`)<br>2. `data/site-config.json`<br>3. localStorage backup | Production |
| **Admin Preview** | 1. URL `?preview=...`<br>2. localStorage preview<br>3. API/file | Editing |
| **GitHub Pages** | localStorage > JSON file (no API) | Static hosting |

### How Admin.html Works (Step-by-Step)
1. **Load**: `AdminEditor.init()` fetches config (API fallback JSON).
2. **Sidebar Navigation**: General/Navigation/Hero/Content/Theme/Images/Popup/GitHub.
3. **Edit**: Real-time forms (inputs/colors/textareas), image cropper (canvas/Cropper.js → base64).
4. **Save Flow**:
   ```
   Edit → updateConfig('hero.title', 'New Title')
         ↓
   Save → POST /api/config + localStorage + download JSON
         ↓ (GitHub optional)
   Auto-publish via github-publisher.js
   ```
5. **Buttons**:
   - **Preview**: Encodes config in URL → opens index.html?preview=...
   - **Export**: Downloads JSON (+ base64 images if JSZip).
   - **Auto Save**: localStorage + GitHub push.

### How Index.html Works (Rendering)
1. **`load-site.js` `initSite()`**: Loads config (priority above).
2. **Populates Sections**:
   ```js
   // Example: Hero
   hero.innerHTML = `<h1>${config.hero.title}</h1>`;
   hero.style.background = `url(${config.hero.backgroundImage})`;
   ```
3. **Applies Theme**: CSS vars (`--primary-color: ${config.theme.colors.primary}`).
4. **Features**: Navbar (sorted menu), popup (localStorage dismiss), mobile menu, smooth scroll.
5. **Images**: `images/uploads/` for dynamic, fallback placeholders.

### Full Edit → Live Flow
```
1. Open admin.html
2. Edit "Hero Title" → Real-time update
3. "Save Changes" → API + JSON download
4. "Preview Site" → index.html with changes (localStorage/URL)
5. Download JSON → Replace data/site-config.json
6. Git push → GitHub Pages live (static)
7. OR: Backend live → Dynamic updates instant
```

**Pro Tip**: Use EC2 backend for real-time; GitHub Pages + localStorage for static preview.

**Troubleshooting**:
| Issue | Cause | Fix |
|-------|-------|-----|
| Admin blank | No config | Check backend/API or create site-config.json |
| Site not updating | localStorage miss | Clear browser storage, reload |
| Images broken | Wrong path | Use relative `images/uploads/fname.jpg` |
| Preview no changes | Cache | Hard refresh (Ctrl+F5) |

## ☁️ Production Deployment (EC2/Ubuntu)



## ☁️ Production Deployment (EC2/Ubuntu)
Use `deploy-ubuntu.sh` or manual:

### 1. Server Setup
```bash
sudo apt update && sudo apt install -y nginx nodejs npm git
sudo npm i -g pm2
```

### 2. Clone & Install
```bash
git clone <repo> /var/www/edc-ltd
cd /var/www/edc-ltd/backend
npm install
pm2 start server.js --name edc-api
pm2 save && pm2 startup
```

### 3. Nginx (`sudo nano /etc/nginx/sites-available/edc-ltd`)
```
server {
    listen 80;
    server_name yourdomain.com;

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location / {
        root /var/www/edc-ltd;
        index index.html admin.html;
        try_files $uri $uri/ =404;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/edc-ltd /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 4. SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🛠️ Troubleshooting
| Issue | Solution |
|-------|----------|
| Backend not starting | `npm install` in `backend/`, check `pm2 logs edc-api` |
| Admin saves fail | Console: API integration pending (localStorage fallback) |
| Images 404 | Check `images/uploads/` permissions, paths absolute |
| Nginx proxy fail | `sudo nginx -t`, restart, check port 3000 open |
| GitHub Pages blank | JS CORS? Use backend for dynamic |

## 📈 Features Status
- ✅ Backend API: Config GET/POST, Image upload (JPG/PNG, 10MB max)
- ✅ Frontend: Dynamic load via JS, Admin UI (partial API)
- ✅ Static hosting ready
- ✅ Production deploy scripts/configs
- ✅ Error handling & CORS

## 🔮 Roadmap (from TODO.md)
- Integrate full API in `admin-editor.js`/`image-uploader.js`
- User authentication
- GitHub auto-publish
- Advanced forms/sections

## 🤝 Contributing
1. Fork & PR.
2. Follow structure.
3. Test local + deploy.

## 📄 License
MIT – See LICENSE (add your own).

**Questions? Open an issue. Backend live, admin ready – build your site!**

