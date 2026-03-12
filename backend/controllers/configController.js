const fs = require('fs-extra');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'site-config.json');

// GET /api/config - Load site configuration
function getConfig(req, res, next) {
  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'Config file not found. Create data/site-config.json' });
    }
    const config = fs.readJsonSync(configPath);
    res.json(config);
  } catch (error) {
    next(error);
  }
}

// POST /api/config - Save site configuration
function updateConfig(req, res, next) {
  try {
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Invalid config data' });
    }
    
    // Write with 2-space indentation as original
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    res.json({ success: true, message: 'Config updated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getConfig, updateConfig };
