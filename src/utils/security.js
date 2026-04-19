import { readFileSync } from 'fs';
import { glob } from 'glob';

/**
 * SecurityAnalyzer — Scans for vulnerabilities and exposed secrets
 */
export class SecurityAnalyzer {
  constructor() {
    this.secretPatterns = [
      { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
      { name: 'AWS Secret Key', pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/ },
      { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
      { name: 'Generic API Key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i },
      { name: 'Generic Secret', pattern: /(?:secret|password|passwd|token)\s*[:=]\s*['"][^'"]{8,}['"]/i },
      { name: 'Private Key', pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/ },
      { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/  },
      { name: 'Slack Token', pattern: /xox[baprs]-[0-9a-zA-Z-]+/ },
      { name: 'Stripe Key', pattern: /(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{20,}/ },
      { name: 'Database URL', pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+/ }
    ];

    this.vulnerabilityChecks = [
      {
        name: 'eval() usage',
        pattern: /\beval\s*\(/,
        severity: 'high',
        description: 'eval() can execute arbitrary code. Consider safer alternatives.'
      },
      {
        name: 'innerHTML assignment',
        pattern: /\.innerHTML\s*=/,
        severity: 'medium',
        description: 'Direct innerHTML assignment can lead to XSS attacks.'
      },
      {
        name: 'SQL injection risk',
        pattern: /(?:query|execute)\s*\(\s*[`'"].*\$\{/,
        severity: 'critical',
        description: 'Template literals in SQL queries may be vulnerable to injection.'
      },
      {
        name: 'Hardcoded credentials',
        pattern: /(?:password|secret|key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
        severity: 'high',
        description: 'Credentials should not be hardcoded. Use environment variables.'
      },
      {
        name: 'CORS wildcard',
        pattern: /(?:cors|origin)\s*[:=]\s*['"]\*['"]/i,
        severity: 'medium',
        description: 'Wildcard CORS allows any origin. Restrict to known domains.'
      },
      {
        name: 'Disabled SSL verification',
        pattern: /rejectUnauthorized\s*:\s*false/,
        severity: 'high',
        description: 'Disabling SSL verification exposes connections to MITM attacks.'
      }
    ];
  }

  async scan(cwd, options = {}) {
    const files = await glob('**/*.{js,ts,jsx,tsx,py,go,rs,java,rb,php,env,yaml,yml,json}', {
      cwd,
      ignore: ['node_modules/**', 'dist/**', '.git/**', '*.lock', 'package-lock.json']
    });

    const issues = [];

    for (const file of files) {
      try {
        const content = readFileSync(`${cwd}/${file}`, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, i) => {
          // Check for exposed secrets
          for (const secret of this.secretPatterns) {
            if (secret.pattern.test(line) && !file.endsWith('.example') && !file.endsWith('.sample')) {
              issues.push({
                title: `Exposed ${secret.name}`,
                description: `Found potential ${secret.name} in source code`,
                file,
                line: i + 1,
                severity: 'critical'
              });
            }
          }

          // Check for vulnerabilities
          for (const vuln of this.vulnerabilityChecks) {
            if (vuln.pattern.test(line)) {
              issues.push({
                title: vuln.name,
                description: vuln.description,
                file,
                line: i + 1,
                severity: vuln.severity
              });
            }
          }
        });

      } catch (e) {
        // Skip unreadable files
      }
    }

    // Deduplicate
    const unique = this.deduplicateIssues(issues);

    return { issues: unique, scannedFiles: files.length };
  }

  deduplicateIssues(issues) {
    const seen = new Set();
    return issues.filter(issue => {
      const key = `${issue.file}:${issue.line}:${issue.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async fix(issues) {
    let fixed = 0;
    // Auto-fix capabilities would go here
    // For now, report what needs manual fixing
    return { fixed, total: issues.length };
  }
}
