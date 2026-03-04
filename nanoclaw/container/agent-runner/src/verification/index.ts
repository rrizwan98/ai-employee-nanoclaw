/**
 * Verification Module
 *
 * Phase 3 Verification Sandbox - Pre-delivery code testing with auto-fix
 *
 * @module verification
 */

// Types
export * from './types.js';

// Configuration
export * from './config.js';

// Core modules
export {
  VerificationOrchestrator,
  getVerificationOrchestrator,
  verifyProject,
} from './orchestrator.js';

export {
  SandboxRunner,
  getSandboxRunner,
} from './sandbox-runner.js';

export {
  AutoFixer,
  getAutoFixer,
  parseErrorType,
} from './auto-fixer.js';

export {
  HumanAlertManager,
  getHumanAlertManager,
  formatAlert,
  formatEscalation,
  analyzeError,
} from './human-alert.js';

export {
  EndpointExtractor,
  getEndpointExtractor,
  extractEndpoints,
  extractEndpointsFromFiles,
  generateTestRequests,
} from './endpoint-extractor.js';
