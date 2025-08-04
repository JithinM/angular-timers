/**
 * Mock server for Angular Timers API
 * Provides endpoints for timer states, settings, and history
 */

const http = require('http');
const url = require('url');
const { timerStatesApi, jsonParser } = require('./api/timer-states');

// Port configuration
const PORT = process.env.PORT || 3000;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Handle CORS preflight requests
const handleCors = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return true;
  }
  return false;
};

// Main request handler
const requestHandler = (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Add CORS headers to all responses
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  console.log(`${method} ${path}`);

  // Route handling
  try {
    // Timer states API
    if (path === '/api/timer-states') {
      switch (method) {
        case 'GET':
          return timerStatesApi.get(req, res);
        case 'POST':
          return jsonParser(req, res, () => timerStatesApi.post(req, res));
        case 'DELETE':
          return timerStatesApi.delete(req, res);
        default:
          res.writeHead(405, headers);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    }
    // Timer states history API
    else if (path === '/api/timer-states/history') {
      switch (method) {
        case 'GET':
          return timerStatesApi.getHistory(req, res);
        default:
          res.writeHead(405, headers);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    }
    // Health check endpoint
    else if (path === '/api/health') {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    }
    // API documentation
    else if (path === '/api/docs') {
      res.writeHead(200, { ...headers, 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Angular Timers API Documentation</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1, h2 { color: #333; }
            code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>Angular Timers API Documentation</h1>
          
          <h2>Endpoints</h2>
          
          <h3>GET /api/timer-states</h3>
          <p>Retrieve timer states for the current user</p>
          <p><strong>Headers:</strong> X-User-ID (optional)</p>
          
          <h3>POST /api/timer-states</h3>
          <p>Save timer states for the current user</p>
          <p><strong>Headers:</strong> X-User-ID (optional), Content-Type: application/json</p>
          <p><strong>Body:</strong> Timer states object</p>
          
          <h3>DELETE /api/timer-states</h3>
          <p>Delete timer states for the current user</p>
          <p><strong>Headers:</strong> X-User-ID (optional)</p>
          
          <h3>GET /api/timer-states/history</h3>
          <p>Retrieve timer states history for the current user</p>
          <p><strong>Headers:</strong> X-User-ID (optional)</p>
          
          <h3>GET /api/health</h3>
          <p>Health check endpoint</p>
        </body>
        </html>
      `);
    }
    // 404 for unknown routes
    else {
      res.writeHead(404, headers);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};

// Create server
const server = http.createServer(requestHandler);

// Start server
server.listen(PORT, () => {
  console.log(`Angular Timers API server running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for testing
module.exports = server;