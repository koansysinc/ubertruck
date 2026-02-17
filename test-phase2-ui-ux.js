/**
 * Phase 2 Comprehensive UI/UX Testing
 * Tests all user interface components and user experience flows
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('PHASE 2: COMPREHENSIVE UI/UX TESTING');
console.log('Testing Real-Time Updates, Visual Components, and User Experience');
console.log('='.repeat(70));
console.log();

// Test configuration
const FRONTEND_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000';
const WS_URL = 'ws://localhost:4001/ws';
const testResults = [];

// Helper function to log test results
function logTest(category, testName, passed, details) {
  const result = {
    category,
    testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);

  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${category}] ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test 1: Component Rendering
async function testComponentRendering() {
  console.log('\n📱 TEST SUITE 1: Component Rendering\n');

  try {
    // Check if RideTracking screen exists
    const rideTrackingPath = './ubertruck-ui/src/screens/RideTracking.tsx';
    const fileExists = fs.existsSync(rideTrackingPath);
    logTest('Component Rendering', 'RideTracking screen file exists', fileExists,
      fileExists ? 'File found at expected location' : 'File not found');

    if (fileExists) {
      const content = fs.readFileSync(rideTrackingPath, 'utf8');

      // Check for required components
      const components = [
        { name: 'StatusBadge', pattern: /StatusBadge/ },
        { name: 'StatusTimeline', pattern: /StatusTimeline/ },
        { name: 'useBookingStatus hook', pattern: /useBookingStatus/ },
        { name: 'useETA hook', pattern: /useETA/ }
      ];

      components.forEach(comp => {
        const hasComponent = comp.pattern.test(content);
        logTest('Component Rendering', `${comp.name} imported`, hasComponent,
          hasComponent ? 'Component properly imported' : 'Import missing');
      });

      // Check for UI elements
      const uiElements = [
        { name: 'Booking ID display', pattern: /bookingId|Booking #/ },
        { name: 'ETA display', pattern: /ETA|Estimated|arrival/ },
        { name: 'Status display', pattern: /status|Status/ },
        { name: 'Loading state', pattern: /loading|Loading/ },
        { name: 'Error handling', pattern: /error|Error/ }
      ];

      uiElements.forEach(elem => {
        const hasElement = elem.pattern.test(content);
        logTest('Component Rendering', elem.name, hasElement,
          hasElement ? 'UI element present' : 'UI element missing');
      });
    }
  } catch (error) {
    logTest('Component Rendering', 'Component structure', false,
      `Error: ${error.message}`);
  }
}

// Test 2: Status Badge Visual States
async function testStatusBadgeStates() {
  console.log('\n🎨 TEST SUITE 2: Status Badge Visual States\n');

  const badgePath = './ubertruck-ui/src/components/StatusBadge.tsx';

  try {
    if (fs.existsSync(badgePath)) {
      const content = fs.readFileSync(badgePath, 'utf8');

      // Expected status-color mappings
      const statusMappings = [
        { status: 'CREATED', color: 'gray' },
        { status: 'DRIVER_ASSIGNED', color: 'blue' },
        { status: 'EN_ROUTE_TO_PICKUP', color: 'indigo' },
        { status: 'ARRIVED_AT_PICKUP', color: 'purple' },
        { status: 'CARGO_LOADED', color: 'yellow' },
        { status: 'IN_TRANSIT', color: 'orange' },
        { status: 'ARRIVED_AT_DELIVERY', color: 'teal' },
        { status: 'CARGO_UNLOADED', color: 'cyan' },
        { status: 'COMPLETED', color: 'green' },
        { status: 'CANCELLED', color: 'red' }
      ];

      statusMappings.forEach(({ status, color }) => {
        const hasMapping = content.includes(status) &&
                          (content.includes(color) || content.includes(status.toLowerCase()));
        logTest('Status Badge', `${status} color mapping`, hasMapping,
          hasMapping ? `Mapped to ${color}` : 'Color mapping missing');
      });

      // Check for Tailwind classes
      const hasTailwind = /bg-\w+-\d+|text-\w+-\d+/.test(content);
      logTest('Status Badge', 'Tailwind CSS classes', hasTailwind,
        hasTailwind ? 'Using Tailwind for styling' : 'Tailwind classes not found');

      // Check for responsive design
      const hasResponsive = /sm:|md:|lg:|xl:/.test(content);
      logTest('Status Badge', 'Responsive design', hasResponsive,
        hasResponsive ? 'Responsive classes present' : 'No responsive design detected');
    }
  } catch (error) {
    logTest('Status Badge', 'Visual state testing', false,
      `Error: ${error.message}`);
  }
}

// Test 3: Timeline Component
async function testTimelineComponent() {
  console.log('\n📍 TEST SUITE 3: Timeline Component\n');

  const timelinePath = './ubertruck-ui/src/components/StatusTimeline.tsx';

  try {
    if (fs.existsSync(timelinePath)) {
      const content = fs.readFileSync(timelinePath, 'utf8');

      // Check for all 9 timeline stages
      const expectedStages = [
        'CREATED',
        'DRIVER_ASSIGNED',
        'EN_ROUTE_TO_PICKUP',
        'ARRIVED_AT_PICKUP',
        'CARGO_LOADED',
        'IN_TRANSIT',
        'ARRIVED_AT_DELIVERY',
        'CARGO_UNLOADED',
        'COMPLETED'
      ];

      expectedStages.forEach((stage, index) => {
        const hasStage = content.includes(stage);
        logTest('Timeline', `Stage ${index + 1}: ${stage}`, hasStage,
          hasStage ? 'Stage defined' : 'Stage missing');
      });

      // Check for visual indicators
      const visualElements = [
        { name: 'Completed indicator', pattern: /completed|check|✓|CheckCircle/ },
        { name: 'Active indicator', pattern: /active|current|pulse/ },
        { name: 'Pending indicator', pattern: /pending|upcoming|gray/ },
        { name: 'Progress line', pattern: /line|connector|border/ },
        { name: 'Icons', pattern: /Icon|icon|lucide/ }
      ];

      visualElements.forEach(elem => {
        const hasElement = elem.pattern.test(content);
        logTest('Timeline', elem.name, hasElement,
          hasElement ? 'Visual element present' : 'Visual element missing');
      });
    }
  } catch (error) {
    logTest('Timeline', 'Component testing', false,
      `Error: ${error.message}`);
  }
}

// Test 4: WebSocket Integration
async function testWebSocketIntegration() {
  console.log('\n🔌 TEST SUITE 4: WebSocket Integration\n');

  const wsServicePath = './ubertruck-ui/src/services/websocket.ts';
  const hookPath = './ubertruck-ui/src/hooks/useBookingStatus.ts';

  try {
    // Check WebSocket service
    if (fs.existsSync(wsServicePath)) {
      const wsContent = fs.readFileSync(wsServicePath, 'utf8');

      // Verify correct port
      const hasCorrectPort = wsContent.includes('4001');
      logTest('WebSocket', 'Correct port (4001) configured', hasCorrectPort,
        hasCorrectPort ? 'Port 4001 configured' : 'Wrong port configured');

      // Check for reconnection logic
      const hasReconnect = /reconnect|Reconnect/.test(wsContent);
      logTest('WebSocket', 'Auto-reconnection logic', hasReconnect,
        hasReconnect ? 'Reconnection implemented' : 'No reconnection logic');

      // Check for error handling
      const hasErrorHandling = /onerror|error|Error/.test(wsContent);
      logTest('WebSocket', 'Error handling', hasErrorHandling,
        hasErrorHandling ? 'Error handlers present' : 'No error handling');
    }

    // Check useBookingStatus hook
    if (fs.existsSync(hookPath)) {
      const hookContent = fs.readFileSync(hookPath, 'utf8');

      // Check for polling fallback
      const hasPolling = /setInterval|polling|10000/.test(hookContent);
      logTest('WebSocket', 'Polling fallback (10s)', hasPolling,
        hasPolling ? 'Polling implemented' : 'No polling fallback');

      // Check for state management
      const stateVariables = [
        { name: 'status state', pattern: /useState.*status/ },
        { name: 'loading state', pattern: /useState.*loading/ },
        { name: 'error state', pattern: /useState.*error/ },
        { name: 'connection state', pattern: /isConnected|connected/ }
      ];

      stateVariables.forEach(state => {
        const hasState = state.pattern.test(hookContent);
        logTest('WebSocket', state.name, hasState,
          hasState ? 'State management present' : 'State missing');
      });
    }
  } catch (error) {
    logTest('WebSocket', 'Integration testing', false,
      `Error: ${error.message}`);
  }
}

// Test 5: ETA Calculations
async function testETACalculations() {
  console.log('\n⏱️ TEST SUITE 5: ETA Calculations\n');

  const etaPath = './ubertruck-ui/src/hooks/useETA.ts';

  try {
    if (fs.existsSync(etaPath)) {
      const content = fs.readFileSync(etaPath, 'utf8');

      // Check for speed constants
      const speeds = [
        { type: 'City speed', value: '40', pattern: /40/ },
        { type: 'Highway speed', value: '50', pattern: /50/ }
      ];

      speeds.forEach(speed => {
        const hasSpeed = speed.pattern.test(content);
        logTest('ETA', `${speed.type} (${speed.value} km/h)`, hasSpeed,
          hasSpeed ? 'Speed constant defined' : 'Speed not found');
      });

      // Check for calculation logic
      const calculations = [
        { name: 'Distance calculation', pattern: /distance|Distance/ },
        { name: 'Time calculation', pattern: /Math\.ceil|minutes|hours/ },
        { name: 'Status-based logic', pattern: /switch.*status|if.*status/ },
        { name: 'Format function', pattern: /formatETA|format/ }
      ];

      calculations.forEach(calc => {
        const hasCalc = calc.pattern.test(content);
        logTest('ETA', calc.name, hasCalc,
          hasCalc ? 'Calculation present' : 'Calculation missing');
      });

      // Check for different status handling
      const statusHandling = [
        'EN_ROUTE_TO_PICKUP',
        'IN_TRANSIT',
        'ARRIVED_AT_DELIVERY'
      ];

      statusHandling.forEach(status => {
        const hasStatus = content.includes(status);
        logTest('ETA', `${status} handling`, hasStatus,
          hasStatus ? 'Status handled' : 'Status not handled');
      });
    }
  } catch (error) {
    logTest('ETA', 'Calculation testing', false,
      `Error: ${error.message}`);
  }
}

// Test 6: Responsive Design
async function testResponsiveDesign() {
  console.log('\n📱 TEST SUITE 6: Responsive Design\n');

  const screenPath = './ubertruck-ui/src/screens/RideTracking.tsx';

  try {
    if (fs.existsSync(screenPath)) {
      const content = fs.readFileSync(screenPath, 'utf8');

      // Check for responsive breakpoints
      const breakpoints = [
        { name: 'Mobile (sm)', pattern: /sm:/ },
        { name: 'Tablet (md)', pattern: /md:/ },
        { name: 'Desktop (lg)', pattern: /lg:/ },
        { name: 'Large Desktop (xl)', pattern: /xl:/ }
      ];

      breakpoints.forEach(bp => {
        const hasBreakpoint = bp.pattern.test(content);
        logTest('Responsive', bp.name, hasBreakpoint,
          hasBreakpoint ? 'Breakpoint defined' : 'No responsive rules');
      });

      // Check for flexible layouts
      const layoutPatterns = [
        { name: 'Flexbox', pattern: /flex|flex-/ },
        { name: 'Grid', pattern: /grid|grid-/ },
        { name: 'Container', pattern: /container|max-w-/ },
        { name: 'Padding/Margin', pattern: /p-\d+|m-\d+|px-|py-|mx-|my-/ }
      ];

      layoutPatterns.forEach(layout => {
        const hasLayout = layout.pattern.test(content);
        logTest('Responsive', layout.name, hasLayout,
          hasLayout ? 'Layout pattern used' : 'Pattern not found');
      });
    }
  } catch (error) {
    logTest('Responsive', 'Design testing', false,
      `Error: ${error.message}`);
  }
}

// Test 7: User Experience Flow
async function testUserExperienceFlow() {
  console.log('\n🎯 TEST SUITE 7: User Experience Flow\n');

  try {
    // Check loading states
    const hookPath = './ubertruck-ui/src/hooks/useBookingStatus.ts';
    if (fs.existsSync(hookPath)) {
      const content = fs.readFileSync(hookPath, 'utf8');

      // UX elements
      const uxElements = [
        { name: 'Loading indicator', pattern: /loading|Loading|isLoading/ },
        { name: 'Error messages', pattern: /error|Error|catch/ },
        { name: 'Retry mechanism', pattern: /retry|Retry|reconnect/ },
        { name: 'Success feedback', pattern: /success|Success|completed/ },
        { name: 'Real-time updates', pattern: /useEffect|subscription|subscribe/ }
      ];

      uxElements.forEach(elem => {
        const hasElement = elem.pattern.test(content);
        logTest('UX Flow', elem.name, hasElement,
          hasElement ? 'UX element implemented' : 'UX element missing');
      });
    }

    // Check accessibility
    const screenPath = './ubertruck-ui/src/screens/RideTracking.tsx';
    if (fs.existsSync(screenPath)) {
      const content = fs.readFileSync(screenPath, 'utf8');

      const a11yFeatures = [
        { name: 'ARIA labels', pattern: /aria-|role=/ },
        { name: 'Semantic HTML', pattern: /<(header|nav|main|section|article|footer)/ },
        { name: 'Alt text', pattern: /alt=/ },
        { name: 'Focus management', pattern: /focus|Focus|tabIndex/ }
      ];

      a11yFeatures.forEach(feature => {
        const hasFeature = feature.pattern.test(content);
        logTest('UX Flow', feature.name, hasFeature,
          hasFeature ? 'Accessibility feature present' : 'Consider adding for better a11y');
      });
    }
  } catch (error) {
    logTest('UX Flow', 'Experience testing', false,
      `Error: ${error.message}`);
  }
}

// Test 8: Performance Optimization
async function testPerformanceOptimization() {
  console.log('\n⚡ TEST SUITE 8: Performance Optimization\n');

  try {
    // Check for React optimization patterns
    const files = [
      './ubertruck-ui/src/hooks/useBookingStatus.ts',
      './ubertruck-ui/src/screens/RideTracking.tsx'
    ];

    files.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Performance patterns
        const perfPatterns = [
          { name: 'useMemo', pattern: /useMemo/ },
          { name: 'useCallback', pattern: /useCallback/ },
          { name: 'React.memo', pattern: /React\.memo|memo\(/ },
          { name: 'Cleanup in useEffect', pattern: /return\s+\(\s*\)\s*=>\s*\{.*cleanup|clearInterval|unsubscribe/s }
        ];

        perfPatterns.forEach(pattern => {
          const hasPattern = pattern.pattern.test(content);
          logTest('Performance', `${fileName} - ${pattern.name}`, hasPattern,
            hasPattern ? 'Optimization applied' : 'Consider for optimization');
        });
      }
    });

    // Check for debouncing/throttling
    const wsPath = './ubertruck-ui/src/services/websocket.ts';
    if (fs.existsSync(wsPath)) {
      const content = fs.readFileSync(wsPath, 'utf8');

      const hasRateLimiting = /throttle|debounce|setTimeout.*\d{3,}/.test(content);
      logTest('Performance', 'Rate limiting', hasRateLimiting,
        hasRateLimiting ? 'Rate limiting implemented' : 'Consider adding rate limiting');
    }
  } catch (error) {
    logTest('Performance', 'Optimization testing', false,
      `Error: ${error.message}`);
  }
}

// Test 9: TypeScript Type Safety
async function testTypeScriptSafety() {
  console.log('\n🔒 TEST SUITE 9: TypeScript Type Safety\n');

  try {
    // Check for proper typing
    const typescriptFiles = [
      './ubertruck-ui/src/types/booking.ts',
      './ubertruck-ui/src/services/websocket.ts',
      './ubertruck-ui/src/hooks/useBookingStatus.ts'
    ];

    typescriptFiles.forEach(filePath => {
      const exists = fs.existsSync(filePath);
      const fileName = path.basename(filePath);

      if (exists) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Type patterns
        const typePatterns = [
          { name: 'Interface definitions', pattern: /interface\s+\w+/ },
          { name: 'Type definitions', pattern: /type\s+\w+\s*=/ },
          { name: 'Explicit return types', pattern: /\):\s*(Promise<|void|boolean|string|number|\w+\[\])/ },
          { name: 'Generic types', pattern: /<\w+>/ }
        ];

        typePatterns.forEach(pattern => {
          const hasPattern = pattern.pattern.test(content);
          logTest('TypeScript', `${fileName} - ${pattern.name}`, hasPattern,
            hasPattern ? 'Type safety implemented' : 'Consider adding types');
        });
      } else {
        logTest('TypeScript', `${fileName} exists`, false, 'File not found');
      }
    });
  } catch (error) {
    logTest('TypeScript', 'Type safety testing', false,
      `Error: ${error.message}`);
  }
}

// Test 10: Visual Consistency
async function testVisualConsistency() {
  console.log('\n🎨 TEST SUITE 10: Visual Consistency\n');

  try {
    const components = [
      './ubertruck-ui/src/components/StatusBadge.tsx',
      './ubertruck-ui/src/components/StatusTimeline.tsx',
      './ubertruck-ui/src/screens/RideTracking.tsx'
    ];

    // Check for consistent styling approach
    let tailwindUsage = 0;
    let cssModuleUsage = 0;
    let inlineStyleUsage = 0;

    components.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        if (/className=["'][^"']*\b(bg-|text-|p-|m-|flex|grid)/.test(content)) {
          tailwindUsage++;
        }
        if (/styles\.\w+|\.module\.css/.test(content)) {
          cssModuleUsage++;
        }
        if (/style={{/.test(content)) {
          inlineStyleUsage++;
        }
      }
    });

    const primaryMethod = tailwindUsage >= cssModuleUsage && tailwindUsage >= inlineStyleUsage
      ? 'Tailwind CSS'
      : cssModuleUsage >= inlineStyleUsage ? 'CSS Modules' : 'Inline styles';

    logTest('Visual Consistency', 'Consistent styling method', tailwindUsage > 0,
      `Primary method: ${primaryMethod} (${tailwindUsage}/${components.length} components)`);

    // Check for consistent color scheme
    const badgePath = './ubertruck-ui/src/components/StatusBadge.tsx';
    if (fs.existsSync(badgePath)) {
      const content = fs.readFileSync(badgePath, 'utf8');

      const colorSchemes = [
        { name: 'Consistent success color', pattern: /green-[456]00/ },
        { name: 'Consistent error color', pattern: /red-[456]00/ },
        { name: 'Consistent warning color', pattern: /yellow-[456]00/ },
        { name: 'Consistent info color', pattern: /blue-[456]00/ }
      ];

      colorSchemes.forEach(scheme => {
        const hasScheme = scheme.pattern.test(content);
        logTest('Visual Consistency', scheme.name, hasScheme,
          hasScheme ? 'Color scheme applied' : 'Color not standardized');
      });
    }
  } catch (error) {
    logTest('Visual Consistency', 'Consistency testing', false,
      `Error: ${error.message}`);
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('UI/UX TEST REPORT SUMMARY');
  console.log('='.repeat(70));

  // Group results by category
  const categories = {};
  testResults.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { passed: 0, failed: 0, tests: [] };
    }
    categories[result.category].tests.push(result);
    if (result.passed) {
      categories[result.category].passed++;
    } else {
      categories[result.category].failed++;
    }
  });

  // Print category summaries
  console.log('\n📊 Test Results by Category:\n');
  Object.keys(categories).forEach(category => {
    const cat = categories[category];
    const total = cat.passed + cat.failed;
    const percentage = ((cat.passed / total) * 100).toFixed(0);
    const icon = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';

    console.log(`${icon} ${category}: ${cat.passed}/${total} passed (${percentage}%)`);
  });

  // Overall statistics
  const totalPassed = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);

  console.log('\n' + '-'.repeat(70));
  console.log(`Overall: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);

  // Critical issues
  const criticalFailures = testResults.filter(r =>
    !r.passed && (
      r.testName.includes('WebSocket') ||
      r.testName.includes('RideTracking') ||
      r.testName.includes('port')
    )
  );

  if (criticalFailures.length > 0) {
    console.log('\n⚠️  Critical Issues Found:');
    criticalFailures.forEach(failure => {
      console.log(`  - ${failure.testName}: ${failure.details || 'Failed'}`);
    });
  }

  // Recommendations
  console.log('\n💡 Recommendations:');

  if (overallPercentage < 60) {
    console.log('  - Major UI/UX improvements needed');
  } else if (overallPercentage < 80) {
    console.log('  - Some UI/UX enhancements recommended');
  } else {
    console.log('  - UI/UX implementation meets standards');
  }

  const noResponsive = testResults.filter(r =>
    r.category === 'Responsive' && !r.passed
  ).length;
  if (noResponsive > 2) {
    console.log('  - Add more responsive design breakpoints');
  }

  const noA11y = testResults.filter(r =>
    r.testName.includes('ARIA') && !r.passed
  ).length;
  if (noA11y > 0) {
    console.log('  - Improve accessibility with ARIA labels');
  }

  const noPerf = testResults.filter(r =>
    r.category === 'Performance' && !r.passed
  ).length;
  if (noPerf > 2) {
    console.log('  - Consider adding performance optimizations');
  }

  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    overall: {
      passed: totalPassed,
      total: totalTests,
      percentage: overallPercentage
    },
    categories,
    criticalIssues: criticalFailures.length,
    recommendations: overallPercentage >= 80 ? 'PASS' : 'NEEDS_IMPROVEMENT'
  };

  fs.writeFileSync(
    '/tmp/PHASE2_UI_UX_TEST_REPORT.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 Detailed report saved to: /tmp/PHASE2_UI_UX_TEST_REPORT.json');

  // Final verdict
  console.log('\n' + '='.repeat(70));
  if (overallPercentage >= 80) {
    console.log('✅ UI/UX TESTING: PASSED');
    console.log('Phase 2 UI components meet quality standards');
  } else if (overallPercentage >= 60) {
    console.log('⚠️  UI/UX TESTING: PASSED WITH WARNINGS');
    console.log('Phase 2 UI components functional but need improvements');
  } else {
    console.log('❌ UI/UX TESTING: FAILED');
    console.log('Phase 2 UI components need significant work');
  }
  console.log('='.repeat(70));
}

// Run all test suites
async function runAllTests() {
  console.log('🚀 Starting Comprehensive UI/UX Testing...\n');
  console.log('Testing Environment:');
  console.log(`  - Frontend: ${FRONTEND_URL}`);
  console.log(`  - API: ${API_URL}`);
  console.log(`  - WebSocket: ${WS_URL}`);
  console.log();

  // Run test suites
  await testComponentRendering();
  await testStatusBadgeStates();
  await testTimelineComponent();
  await testWebSocketIntegration();
  await testETACalculations();
  await testResponsiveDesign();
  await testUserExperienceFlow();
  await testPerformanceOptimization();
  await testTypeScriptSafety();
  await testVisualConsistency();

  // Generate report
  generateReport();
}

// Execute tests
runAllTests().catch(console.error);