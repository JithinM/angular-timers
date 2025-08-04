/**
 * Mock API for timer states
 * This is a simple in-memory storage for timer states
 */

// In-memory storage for timer states
let timerStates = new Map();
let history = new Map();

// Middleware to parse JSON bodies
const jsonParser = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(body);
        next();
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    next();
  }
};

// Timer states API handlers
const timerStatesApi = {
  // Get timer states for a user
  get: (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const states = timerStates.get(userId) || null;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(states));
  },

  // Save timer states for a user
  post: (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    if (!req.body) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No data provided' }));
      return;
    }
    
    // Store the timer states
    timerStates.set(userId, {
      ...req.body,
      lastUpdated: new Date().toISOString()
    });
    
    // Add to history
    if (!history.has(userId)) {
      history.set(userId, []);
    }
    
    const userHistory = history.get(userId);
    userHistory.push({
      timestamp: new Date().toISOString(),
      states: req.body
    });
    
    // Keep only last 100 entries
    if (userHistory.length > 100) {
      userHistory.shift();
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  },

  // Delete timer states for a user
  delete: (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const deleted = timerStates.delete(userId);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: deleted }));
  },

  // Get history for a user
  getHistory: (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const userHistory = history.get(userId) || [];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(userHistory));
  }
};

// Export the API handlers
module.exports = {
  timerStatesApi,
  jsonParser
};