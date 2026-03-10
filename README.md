# English Development Consultants Co. Ltd. - Company Profile Website

A modern, responsive company profile website with a complete admin dashboard for managing all content without editing HTML files.

## 📁 Folder Structure

```
/
├── index.html              # Main website (dynamically loads content from JSON)
├── admin.html              # Admin dashboard for content management
├── server.js               # Local backend server (Node.js/Express)
├── package.json            # Node.js dependencies
│
├── data/
│   └── site-config.json    # All website configuration (content, colors, images, etc.)
│
├── css/
│   ├── style.css           # Main website styles
│   └── admin.css           # Admin dashboard styles
│
├── js/
│   ├── load-site.js        # Loads website content from JSON
│   ├── admin-editor.js     # Admin panel functionality
│   ├── popup.js            # Fullscreen popup system
│   ├── github-publisher.js # GitHub API integration
│   ├── navbar-loader.js    # Loads navigation (legacy)
│   └── animations.js       # Scroll animations
│
└── images/
    ├── hero.jpg            # Hero section background
    ├── intro.jpg           # Introduction section image
    ├── popup.jpg           # Popup image
    ├── logo.png            # Site logo
    ├── team1.jpg           # Team member 1
    ├── team2.jpg           # Team member 2
    ├── team3.jpg           # Team member 3
    ├── team4.jpg           # Team member 4
    └── gallery/            # Gallery images (1.jpg - 8.jpg)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

### 3. Access the Website

- **Public Website:** http://localhost:3000/index.html
- **Admin Dashboard:** http://localhost:3000/admin.html

## 🎯 Features

### Public Website (index.html)
- ✅ Dynamically loads all content from `site-config.json`
- ✅ Fully responsive (Desktop, Tablet, Mobile)
- ✅ Smooth scroll navigation
- ✅ Scroll animations
- ✅ Optional fullscreen popup with customization
- ✅ Image placeholder fallbacks
- ✅ Clean corporate design (Deep Blue + Green)

### Admin Dashboard (admin.html)

#### 1. General Settings
- Site name and description
- Logo and favicon URLs

#### 2. Navigation Editor
- Enable/disable navigation
- Edit logo text and link
- Add/remove/reorder menu items
- Configure apply button
- Customize colors, fonts, and hover effects
- Mobile menu style

#### 3. Hero Section
- Title, tagline, button text
- Button link (external application)
- Background image
- Overlay and text colors

#### 4. Content Editor
- **Introduction:** Title, paragraphs, image
- **Company Overview:** Mission and Vision with icons
- **Services:** Add/edit/remove services with icons
- **Team:** Add/edit team members with photos
- **Gallery:** Manage gallery images
- **Contact:** Company details and form settings
- **Footer:** About text, quick links, social links

#### 5. Theme & Colors
- Primary colors (Deep Blue)
- Secondary colors (Green)
- Background colors
- Text colors
- Button colors
- Typography settings (fonts, sizes)

#### 6. Image Management
- Upload images for all sections
- Preview and manage existing images

#### 7. Popup Editor
- Enable/disable popup
- Custom title, description, image
- Button text and link
- Background and text colors
- "Do not show again today" functionality

#### 8. GitHub Publish Panel
- Connect to GitHub repository
- Publish website with one click
- Automatically commits updated files to GitHub

## ⚙️ Configuration

### JSON Configuration Structure

The `data/site-config.json` file contains all website settings:

```json
{
  "site": {
    "name": "English Development Consultants Co. Ltd.",
    "logo": "images/logo.png"
  },
  "navigation": {
    "enabled": true,
    "menu": [
      { "text": "Home", "link": "#home", "order": 1 }
    ]
  },
  "hero": {
    "title": "English Development Consultants Co. Ltd.",
    "tagline": "Be Part of Our Team"
  },
  "theme": {
    "colors": {
      "primary": "#1a365d",
      "secondary": "#38a169"
    }
  }
}
```

### Editing Configuration Manually

You can also edit the `site-config.json` file directly:

1. Open `data/site-config.json` in a text editor
2. Modify the values
3. Save the file
4. Refresh the website

## 🔧 GitHub Publishing

### Setting Up GitHub Publishing

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate new token with `repo` scope

2. In Admin Dashboard > GitHub Publish:
   - Enter Repository URL (e.g., `https://github.com/username/repo`)
   - Enter GitHub Username
   - Enter Personal Access Token
   - Enter Branch name (default: `main`)

3. Click "Test Connection" to verify

4. Click "Publish Website" to upload:
   - index.html
   - data/site-config.json
   - css/style.css

## 📱 Responsive Design

The website automatically adapts to all screen sizes:

- **Desktop:** 1200px+
- **Tablet:** 768px - 1199px
- **Mobile:** < 768px

Features:
- Hamburger navigation on mobile
- Flexible grid layouts
- Responsive images
- Touch-friendly interactions

## 🔨 Image Placeholders

If an image is missing, a placeholder will automatically appear:

```html
<img src="images/hero.jpg" 
     alt="Hero" 
     onerror="this.src='https://via.placeholder.com/400x300'">
```

## 🛠️ Customization

### Changing Colors

Edit the `theme.colors` section in `site-config.json`:

```json
"theme": {
  "colors": {
    "primary": "#1a365d",
    "secondary": "#38a169"
  }
}
```

### Adding Services

1. Go to Admin Dashboard > Content Editor > Services
2. Click "+ Add Service"
3. Fill in title, icon, and description

### Adding Team Members

1. Go to Admin Dashboard > Content Editor > Team
2. Click "+ Add Team Member"
3. Enter name, position, and upload photo

### Enabling Popup

1. Go to Admin Dashboard > Popup Editor
2. Enable popup toggle
3. Fill in title, description, image
4. Set colors
5. Save changes

## 📝 API Endpoints

The backend server provides these API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get site configuration |
| POST | `/api/save-config` | Save site configuration |
| POST | `/api/upload-image` | Upload single image |
| POST | `/api/upload-gallery` | Upload gallery images |
| GET | `/api/images` | List all images |
| DELETE | `/api/images/:filename` | Delete image |
| POST | `/api/reset-config` | Reset to default config |

## 🔒 Security Notes

- The GitHub Personal Access Token is stored locally in the browser
- For production, use environment variables for sensitive data
- Consider adding authentication to the admin panel

## 🐛 Troubleshooting

### Navbar not loading
- Make sure you're running the local server (not opening files directly)
- Check browser console for errors

### Images not showing
- Verify image paths in `site-config.json`
- Check that image files exist in the `images` folder

### Admin changes not saving
- Ensure the server is running
- Check write permissions on `data` folder

### GitHub publishing fails
- Verify your Personal Access Token has `repo` scope
- Check repository URL format
- Ensure branch exists

## 📄 License

MIT License

---

Created for English Development Consultants Co. Ltd.

