const fs = require('fs');
const path = require('path');

// Read all route files
const routeFiles = [
  'src/routes/userRoutes.js',
  'src/routes/fleetRoutes.js',
  'src/routes/bookingRoutes.js',
  'src/routes/paymentRoutes.js',
  'src/routes/adminRoutes.js'
];

console.log('=====================================');
console.log('   UBERTRUCK MVP - API ENDPOINTS');
console.log('=====================================\n');
console.log('Base URL: http://localhost:3000');
console.log('API Version: v1\n');

// Parse each route file
routeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const serviceName = path.basename(file, '.js').replace('Routes', '').toUpperCase();

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 ${serviceName} SERVICE`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Extract routes using regex
    const routePattern = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    const routes = [];
    let match;

    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2];
      if (!routePath.includes('docs')) {  // Skip docs endpoints
        routes.push({ method, path: routePath });
      }
    }

    // Print routes
    routes.forEach(route => {
      const service = serviceName.toLowerCase();
      const fullPath = `/api/v1/${service}${route.path === '/' ? '' : route.path}`;
      console.log(`${route.method.padEnd(6)} ${fullPath}`);
    });
  }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 SYSTEM ENDPOINTS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('GET    /health');
console.log('GET    /api/v1');
console.log('GET    /api/v1/*/docs (Documentation for each service)');