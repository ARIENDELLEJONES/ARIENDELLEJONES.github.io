# TODO: Content Editor Layout Controls

## Plan Overview
Add layout controls to the content editor allowing users to:
- Set alignment (left, center, right)
- Configure number of columns (1-4)
- Assign items to specific columns (first, last, or specific)
- Set order/row position for each item

## Tasks

### 1. Update site-config.json Schema
- [x] Add layout properties to Team section (columns, alignment, per-item columnAssignment and order)
- [x] Add layout properties to Services section
- [x] Add layout properties to Clients section  
- [x] Add layout properties to Gallery section

### 2. Update admin-editor.js - Layout Controls UI
- [x] Add renderLayoutSettings() function
- [x] Add layout controls to Team editor (columns selector, alignment, per-item column/order)
- [x] Add updateConfig() function to handle nested layout properties
- [ ] Add layout controls to Services editor
- [ ] Add layout controls to Clients editor
- [ ] Add layout controls to Gallery editor

### 3. Update css/style.css / admin.css
- [x] Add CSS grid classes for columns (.grid-2-col, .grid-3-col, .grid-4-col)
- [x] Add alignment classes (.align-left, .align-center, .align-right)
- [x] Add column span classes
- [x] Add layout settings styles in admin.css

### 4. Update index.html (if needed)
- [ ] Ensure layout classes are applied when rendering sections

## Status: In Progress - Team section done

