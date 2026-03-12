function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 10MB.' });
  }
  
  if (err.code === 'LIMIT_FILE_TYPES') {
    return res.status(400).json({ error: 'Invalid file type. Images only.' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
