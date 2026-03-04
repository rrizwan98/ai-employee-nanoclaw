/**
 * Human Alert Module
 *
 * Sends verification alerts to human via WhatsApp/IPC
 */

import { ALERT_TEMPLATE, ESCALATION_TEMPLATE, MAX_ATTEMPTS } from './config.js';
import type {
  HumanAlert,
  AutoFixAttempt,
  VerificationResult,
  ErrorType,
  FixSource,
} from './types.js';

/**
 * Format a human alert message
 */
export function formatAlert(alert: HumanAlert): string {
  let message = ALERT_TEMPLATE
    .replace('{attempt}', String(alert.attempt))
    .replace('{max_attempts}', String(alert.max_attempts))
    .replace('{error_type}', alert.error?.type || 'N/A')
    .replace('{location}', alert.error?.location || 'unknown')
    .replace('{message}', alert.error?.message || 'No error message')
    .replace('{analysis}', alert.analysis || 'Analyzing...')
    .replace('{fix_applied}', alert.fix?.applied || 'None')
    .replace('{fix_source}', alert.fix?.source || 'N/A');

  // Add status indicator
  const statusEmoji: Record<HumanAlert['status'], string> = {
    verifying: '',
    error: '',
    fixed: '',
    passed: '',
    escalated: '',
  };

  return `${statusEmoji[alert.status]} ${message}`;
}

/**
 * Format escalation message
 */
export function formatEscalation(
  result: VerificationResult,
  history: AutoFixAttempt[]
): string {
  // Get final error
  const finalAttempt = history[history.length - 1];
  const finalError = finalAttempt?.errors[0];

  // Format attempt history
  const historyLines = history.map((attempt, i) => {
    const error = attempt.errors[0];
    const fix = attempt.fix_applied;
    return `  ${i + 1}. ${error?.type || 'unknown'}: ${error?.message?.slice(0, 50) || 'No error'}...
     Fix: ${fix ? `${fix.correct.slice(0, 40)}... (${fix.source})` : 'None'}`;
  }).join('\n');

  return ESCALATION_TEMPLATE
    .replace('{project_path}', result.project_path)
    .replace('{project_type}', result.project_type)
    .replace('{attempts}', String(result.attempts))
    .replace('{max_attempts}', String(MAX_ATTEMPTS))
    .replace('{final_error}', finalError?.message || 'Unknown error')
    .replace('{attempt_history}', historyLines);
}

/**
 * Human Alert Manager
 */
export class HumanAlertManager {
  private static instance: HumanAlertManager;
  private alertCallback?: (message: string) => Promise<void>;

  private constructor() {}

  static getInstance(): HumanAlertManager {
    if (!HumanAlertManager.instance) {
      HumanAlertManager.instance = new HumanAlertManager();
    }
    return HumanAlertManager.instance;
  }

  /**
   * Set callback for sending alerts (e.g., WhatsApp via IPC)
   */
  setAlertCallback(callback: (message: string) => Promise<void>): void {
    this.alertCallback = callback;
  }

  /**
   * Create alert from verification error
   */
  createAlert(
    attempt: number,
    maxAttempts: number,
    projectPath: string,
    projectType: 'backend' | 'frontend',
    error?: { type: ErrorType; location: string; message: string },
    analysis?: string,
    fix?: { applied: string; source: FixSource }
  ): HumanAlert {
    return {
      attempt,
      max_attempts: maxAttempts,
      status: error ? (fix ? 'fixed' : 'error') : 'verifying',
      project_path: projectPath,
      project_type: projectType,
      error,
      analysis,
      fix,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send notification for a verification attempt
   */
  async notify(alert: HumanAlert): Promise<void> {
    const message = formatAlert(alert);
    console.log('[HumanAlert] Notifying:', message);

    if (this.alertCallback) {
      try {
        await this.alertCallback(message);
      } catch (err) {
        console.error('[HumanAlert] Failed to send alert:', err);
      }
    }
  }

  /**
   * Send escalation after all attempts failed
   */
  async escalate(
    result: VerificationResult,
    history: AutoFixAttempt[]
  ): Promise<void> {
    const message = formatEscalation(result, history);
    console.log('[HumanAlert] Escalating:', message);

    if (this.alertCallback) {
      try {
        await this.alertCallback(message);
      } catch (err) {
        console.error('[HumanAlert] Failed to send escalation:', err);
      }
    }
  }

  /**
   * Send success notification
   */
  async notifySuccess(
    projectPath: string,
    projectType: 'backend' | 'frontend',
    attempts: number
  ): Promise<void> {
    const message = ` VERIFICATION PASSED

PROJECT: ${projectPath}
TYPE: ${projectType}
ATTEMPTS: ${attempts}

All 4 levels passed. Code is ready for delivery.`;

    console.log('[HumanAlert] Success:', message);

    if (this.alertCallback) {
      try {
        await this.alertCallback(message);
      } catch (err) {
        console.error('[HumanAlert] Failed to send success:', err);
      }
    }
  }
}

// Export singleton getter
export function getHumanAlertManager(): HumanAlertManager {
  return HumanAlertManager.getInstance();
}

/**
 * Analyze error to provide human-readable explanation
 */
export function analyzeError(
  errorType: ErrorType,
  message: string
): string {
  switch (errorType) {
    case 'import':
      if (message.includes('chatkit')) {
        return 'ChatKit import path changed in recent SDK update. Using outdated import syntax.';
      }
      if (message.includes('CodeInterpreter')) {
        return 'CodeInterpreterTool requires tool_config parameter since SDK v0.7.0.';
      }
      return 'Module or import path not found. May be outdated or misspelled.';

    case 'syntax':
      if (message.includes('{{')) {
        return 'Template variable not substituted. Missing template parameter.';
      }
      return 'Python syntax error. Code has invalid syntax.';

    case 'type':
      if (message.includes('context')) {
        return 'ChatKit Store methods require context parameter. Missing required argument.';
      }
      return 'Type mismatch or incorrect function signature.';

    case 'directive':
      return 'Next.js client component missing "use client" directive. Required for hooks/events.';

    case 'build':
      return 'Frontend build failed. Check TypeScript errors or missing dependencies.';

    case 'runtime':
      return 'Agent or server failed to start. Check configuration and environment.';

    case 'endpoint':
      return 'Endpoint returned unexpected status. Check route handler implementation.';

    default:
      return 'Unknown error type. Manual review recommended.';
  }
}
