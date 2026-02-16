// @root/src/helpers/injectionDetector.ts

/**
 * Detects prompt injection attempts in user messages.
 * Uses Unicode NFKC normalization to prevent evasion via lookalike characters.
 */

/** Injection detection result */
export interface InjectionCheckResult {
  detected: boolean
  patterns: string[]
}

/** Patterns that indicate prompt injection attempts */
const INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: 'system_override',
    pattern:
      /\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|above|prior|earlier)\s+(?:instructions?|prompts?|rules?|guidelines?)/i,
  },
  {
    name: 'role_hijack',
    pattern:
      /\b(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you(?:'re| are))|new\s+(?:role|persona|identity|instructions?))\b/i,
  },
  {
    name: 'system_prompt_leak',
    pattern:
      /\b(?:reveal|show|display|print|output|repeat)\s+(?:\w+\s+)?(?:your\s+)?(?:system\s+)?(?:prompt|instructions?|guidelines?|rules?)\b/i,
  },
  {
    name: 'delimiter_injection',
    pattern:
      /(?:<\/?system>|<\/?user>|<\/?assistant>|\[SYSTEM\]|\[INST\]|\[\/INST\]|<<SYS>>|<\|(?:im_start|im_end|system|user|assistant)\|>)/i,
  },
  {
    name: 'jailbreak_dan',
    pattern:
      /\b(?:DAN|do\s+anything\s+now|jailbreak|bypass\s+(?:filters?|restrictions?|safety|guidelines?))\b/i,
  },
  {
    name: 'developer_mode',
    pattern:
      /\b(?:developer\s+mode|maintenance\s+mode|debug\s+mode|admin\s+mode|god\s+mode)\s+(?:enabled?|activated?|on)\b/i,
  },
]

/**
 * Check a message for prompt injection patterns.
 * Normalizes text with NFKC to prevent Unicode evasion (e.g., ⓘgnore → ignore).
 */
export function checkInjection(text: string): InjectionCheckResult {
  // Normalize Unicode to prevent evasion via lookalike characters
  const normalized = text.normalize('NFKC')

  const detected: string[] = []
  for (const { name, pattern } of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      detected.push(name)
    }
  }

  return {
    detected: detected.length > 0,
    patterns: detected,
  }
}
