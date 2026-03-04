/**
 * Verification Orchestrator
 *
 * Main orchestration for Phase 3 Verification Sandbox
 * Coordinates verification tests, auto-fix, and human alerts
 */

import * as fs from 'fs';
import * as path from 'path';
import { MAX_ATTEMPTS, VERIFICATION_TIMEOUT_MS } from './config.js';
import { getSandboxRunner } from './sandbox-runner.js';
import { getAutoFixer, parseErrorType } from './auto-fixer.js';
import { getHumanAlertManager, analyzeError } from './human-alert.js';
import type {
  VerificationRequest,
  VerificationResult,
  VerificationError,
  AutoFixAttempt,
  LevelResult,
  VerificationLevel,
} from './types.js';

// IPC directory for WhatsApp alerts
const IPC_DIR = '/workspace/ipc';
const MESSAGES_DIR = path.join(IPC_DIR, 'messages');

/**
 * Write IPC message file for WhatsApp delivery
 */
function writeIpcAlert(chatJid: string, text: string, groupFolder: string): void {
  const dir = path.join(IPC_DIR, groupFolder, 'messages');
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const filepath = path.join(dir, filename);

  const data = {
    type: 'message',
    chatJid,
    text,
    sender: 'Verification Bot',
    groupFolder,
    timestamp: new Date().toISOString(),
  };

  // Atomic write: temp file then rename
  const tempPath = `${filepath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, filepath);

  console.log(`[Orchestrator] IPC alert written: ${filename}`);
}

/**
 * Verification Orchestrator class
 */
export class VerificationOrchestrator {
  private static instance: VerificationOrchestrator;

  private sandboxRunner = getSandboxRunner();
  private autoFixer = getAutoFixer();
  private alertManager = getHumanAlertManager();

  // IPC configuration for WhatsApp alerts
  private alertChatJid: string = '';
  private alertGroupFolder: string = '';

  private constructor() {
    // Set up IPC callback for human alerts
    this.setupAlertCallback();
  }

  /**
   * Set up the alert callback to send messages via IPC
   */
  private setupAlertCallback(): void {
    // Read from environment variables set by container runner
    const chatJid = process.env.NANOCLAW_CHAT_JID || '';
    const groupFolder = process.env.NANOCLAW_GROUP_FOLDER || 'main';

    this.alertChatJid = chatJid;
    this.alertGroupFolder = groupFolder;

    // Set the callback on the alert manager
    this.alertManager.setAlertCallback(async (message: string) => {
      if (!this.alertChatJid) {
        console.log('[Orchestrator] No chat JID configured, alert not sent to WhatsApp');
        return;
      }

      try {
        writeIpcAlert(this.alertChatJid, message, this.alertGroupFolder);
      } catch (error) {
        console.error('[Orchestrator] Failed to write IPC alert:', error);
      }
    });

    console.log(`[Orchestrator] Alert callback configured for ${chatJid || 'logging only'}`);
  }

  /**
   * Configure alert destination (can be called to override environment variables)
   */
  configureAlerts(chatJid: string, groupFolder: string): void {
    this.alertChatJid = chatJid;
    this.alertGroupFolder = groupFolder;
    console.log(`[Orchestrator] Alert destination updated: ${chatJid}`);
  }

  static getInstance(): VerificationOrchestrator {
    if (!VerificationOrchestrator.instance) {
      VerificationOrchestrator.instance = new VerificationOrchestrator();
    }
    return VerificationOrchestrator.instance;
  }

  /**
   * Run full verification with auto-fix loop
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const startTime = Date.now();
    const {
      project_path,
      project_type,
      auto_fix = true,
      max_attempts = MAX_ATTEMPTS,
      run_level_3 = true,
      run_level_4 = true,
    } = request;

    console.log(`[Orchestrator] Starting verification for ${project_path} (${project_type})`);

    const history: AutoFixAttempt[] = [];
    let attempt = 0;
    let lastResult: Awaited<ReturnType<typeof this.sandboxRunner.runTests>> | null = null;

    while (attempt < max_attempts) {
      attempt++;
      console.log(`[Orchestrator] Attempt ${attempt}/${max_attempts}`);

      // Run verification tests
      const testResult = await this.sandboxRunner.runTests(project_path, project_type, {
        runLevel3: run_level_3,
        runLevel4: run_level_4,
      });

      lastResult = testResult;

      // Collect all errors
      const allErrors: VerificationError[] = [];
      for (const level of ['level1', 'level2', 'level3', 'level4'] as VerificationLevel[]) {
        allErrors.push(...testResult.levels[level].errors);
      }

      // Record attempt
      const attemptRecord: AutoFixAttempt = {
        attempt_number: attempt,
        timestamp: new Date().toISOString(),
        errors: allErrors,
        verification_after: {
          passed: testResult.passed,
          levels: testResult.levels,
        },
      };

      // Alert human about this attempt
      if (allErrors.length > 0) {
        const primaryError = allErrors[0];
        const errorType = parseErrorType(primaryError);
        const analysis = analyzeError(errorType, primaryError.message);

        await this.alertManager.notify({
          attempt,
          max_attempts: max_attempts,
          status: 'error',
          project_path,
          project_type,
          error: {
            type: errorType,
            location: primaryError.location || 'unknown',
            message: primaryError.message,
          },
          analysis,
          timestamp: new Date().toISOString(),
        });
      }

      // Check if passed
      if (testResult.passed) {
        console.log(`[Orchestrator] Verification passed on attempt ${attempt}`);

        // Notify success
        await this.alertManager.notifySuccess(project_path, project_type, attempt);

        history.push(attemptRecord);
        return this.buildResult(
          true,
          request,
          testResult,
          history,
          startTime
        );
      }

      // Attempt auto-fix if enabled and not last attempt
      if (auto_fix && attempt < max_attempts && allErrors.length > 0) {
        console.log(`[Orchestrator] Attempting auto-fix...`);

        const fixResult = await this.autoFixer.fix(allErrors, project_path);

        if (fixResult.applied && fixResult.fix) {
          console.log(`[Orchestrator] Fix applied from ${fixResult.fix.source}`);

          attemptRecord.fix_applied = fixResult.fix;

          // Alert human about the fix
          await this.alertManager.notify({
            attempt,
            max_attempts: max_attempts,
            status: 'fixed',
            project_path,
            project_type,
            error: {
              type: parseErrorType(allErrors[0]),
              location: allErrors[0].location || 'unknown',
              message: allErrors[0].message,
            },
            analysis: analyzeError(parseErrorType(allErrors[0]), allErrors[0].message),
            fix: {
              applied: fixResult.fix.correct,
              source: fixResult.fix.source,
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log(`[Orchestrator] No fix available: ${fixResult.reason}`);
        }
      }

      history.push(attemptRecord);
    }

    // All attempts exhausted - escalate to human
    console.log(`[Orchestrator] All ${max_attempts} attempts exhausted, escalating to human`);

    await this.alertManager.escalate(
      this.buildResult(false, request, lastResult!, history, startTime),
      history
    );

    return this.buildResult(
      false,
      request,
      lastResult!,
      history,
      startTime,
      true // requires human
    );
  }

  /**
   * Build final verification result
   */
  private buildResult(
    success: boolean,
    request: VerificationRequest,
    testResult: Awaited<ReturnType<typeof this.sandboxRunner.runTests>>,
    history: AutoFixAttempt[],
    startTime: number,
    requiresHuman: boolean = false
  ): VerificationResult {
    const now = new Date().toISOString();

    // Determine delivery readiness
    // Level 1 and 2 must pass for delivery
    const deliveryReady =
      testResult.levels.level1.passed &&
      testResult.levels.level2.passed;

    return {
      success,
      project_path: request.project_path,
      project_type: request.project_type,
      attempts: history.length,
      max_attempts: request.max_attempts || MAX_ATTEMPTS,
      levels: testResult.levels,
      endpoints: testResult.endpoints
        ? {
            tested: testResult.endpoints.length,
            passed: testResult.endpoints.filter(e => e.passed).length,
            failures: testResult.endpoints.filter(e => !e.passed),
          }
        : undefined,
      history,
      delivery_ready: deliveryReady,
      requires_human: requiresHuman,
      total_duration_ms: Date.now() - startTime,
      started_at: new Date(startTime).toISOString(),
      completed_at: now,
    };
  }

  /**
   * Quick verification (Level 1-2 only)
   */
  async quickVerify(
    projectPath: string,
    projectType: 'backend' | 'frontend'
  ): Promise<{ passed: boolean; errors: VerificationError[] }> {
    const result = await this.sandboxRunner.runTests(projectPath, projectType, {
      runLevel3: false,
      runLevel4: false,
    });

    const errors: VerificationError[] = [
      ...result.levels.level1.errors,
      ...result.levels.level2.errors,
    ];

    return {
      passed: result.levels.level1.passed && result.levels.level2.passed,
      errors,
    };
  }

  /**
   * Verify single level
   */
  async verifyLevel(
    projectPath: string,
    projectType: 'backend' | 'frontend',
    level: VerificationLevel
  ): Promise<LevelResult> {
    const runOptions = {
      runLevel3: level === 'level3' || level === 'level4',
      runLevel4: level === 'level4',
    };

    const result = await this.sandboxRunner.runTests(
      projectPath,
      projectType,
      runOptions
    );

    return result.levels[level];
  }
}

// Export singleton getter
export function getVerificationOrchestrator(): VerificationOrchestrator {
  return VerificationOrchestrator.getInstance();
}

/**
 * Convenience function for quick verification
 */
export async function verifyProject(
  request: VerificationRequest
): Promise<VerificationResult> {
  return getVerificationOrchestrator().verify(request);
}
