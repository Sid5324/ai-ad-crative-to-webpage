// src/lib/core/testing-framework.ts - Comprehensive Testing Framework
export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  input: any;
  expectedOutput?: any;
  assertions: TestAssertion[];
  timeout?: number;
  skip?: boolean;
}

export interface TestAssertion {
  type: 'equal' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex_match';
  field?: string;
  value: any;
  message?: string;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  duration: number;
  error?: string;
  assertions: { passed: boolean; message: string }[];
  metadata?: any;
}

export class TestRunner {
  private testCases: TestCase[] = [];
  private results: TestResult[] = [];

  addTest(test: TestCase): void {
    this.testCases.push(test);
  }

  addTests(tests: TestCase[]): void {
    this.testCases.push(...tests);
  }

  async runTests(filter?: { category?: string; ids?: string[] }): Promise<TestResult[]> {
    const testsToRun = this.testCases.filter(test => {
      if (test.skip) return false;
      if (filter?.category && test.category !== filter.category) return false;
      if (filter?.ids && !filter.ids.includes(test.id)) return false;
      return true;
    });

    console.log(`🧪 Running ${testsToRun.length} tests`);

    for (const test of testsToRun) {
      const result = await this.runTest(test);
      this.results.push(result);

      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${test.id}: ${test.name} (${result.duration}ms)`);

      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }

    return this.results;
  }

  private async runTest(test: TestCase): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Execute the test (this would need to be implemented based on test type)
      const output = await this.executeTest(test);

      // Run assertions
      const assertions = test.assertions.map(assertion => {
        const passed = this.runAssertion(assertion, output);
        return {
          passed,
          message: assertion.message || `${assertion.type} assertion ${passed ? 'passed' : 'failed'}`
        };
      });

      const passed = assertions.every(a => a.passed);

      return {
        testId: test.id,
        passed,
        duration: Date.now() - startTime,
        assertions,
        metadata: { category: test.category }
      };

    } catch (error) {
      return {
        testId: test.id,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        assertions: []
      };
    }
  }

  private async executeTest(test: TestCase): Promise<any> {
    // This is a placeholder - actual test execution would depend on the system
    // For now, just return mock data
    switch (test.category) {
      case 'unit':
        return this.runUnitTest(test);
      case 'integration':
        return this.runIntegrationTest(test);
      case 'e2e':
        return this.runE2eTest(test);
      case 'performance':
        return this.runPerformanceTest(test);
      case 'security':
        return this.runSecurityTest(test);
      default:
        throw new Error(`Unknown test category: ${test.category}`);
    }
  }

  private async runUnitTest(test: TestCase): Promise<any> {
    // Mock unit test execution
    return { result: 'unit_test_passed', input: test.input };
  }

  private async runIntegrationTest(test: TestCase): Promise<any> {
    // Mock integration test execution
    return { result: 'integration_test_passed', input: test.input };
  }

  private async runE2eTest(test: TestCase): Promise<any> {
    // Mock E2E test execution
    return { result: 'e2e_test_passed', input: test.input };
  }

  private async runPerformanceTest(test: TestCase): Promise<any> {
    const start = Date.now();
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    const duration = Date.now() - start;

    return { duration, performance: 'good' };
  }

  private async runSecurityTest(test: TestCase): Promise<any> {
    // Mock security test execution
    return { vulnerabilities: 0, security: 'passed' };
  }

  private runAssertion(assertion: TestAssertion, output: any): boolean {
    const value = assertion.field ? output[assertion.field] : output;

    switch (assertion.type) {
      case 'equal':
        return value === assertion.value;
      case 'contains':
        return String(value).includes(String(assertion.value));
      case 'not_contains':
        return !String(value).includes(String(assertion.value));
      case 'greater_than':
        return Number(value) > Number(assertion.value);
      case 'less_than':
        return Number(value) < Number(assertion.value);
      case 'regex_match':
        return new RegExp(assertion.value).test(String(value));
      default:
        return false;
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary(): { total: number; passed: number; failed: number; successRate: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? passed / total : 0
    };
  }
}

// Predefined test suites
export const createAdCreativeTestSuite = (): TestCase[] => [
  {
    id: 'semantic-drift-doordash',
    name: 'DoorDash Semantic Drift Validation',
    description: 'Ensure DoorDash content avoids forbidden luxury terms',
    category: 'unit',
    input: { brand: 'doordash', content: 'Fresh food delivered fast with premium service' },
    assertions: [
      {
        type: 'not_contains',
        field: 'content',
        value: 'luxury',
        message: 'Content should not contain forbidden term "luxury"'
      },
      {
        type: 'contains',
        field: 'content',
        value: 'fast',
        message: 'Content should contain key term "fast"'
      }
    ]
  },
  {
    id: 'visual-consistency-validation',
    name: 'Visual Consistency Check',
    description: 'Verify brand colors are properly applied',
    category: 'unit',
    input: { brand: 'doordash', colors: { primary: '#EB1700', accent: '#FFFFFF' } },
    assertions: [
      {
        type: 'equal',
        field: 'colors.primary',
        value: '#EB1700',
        message: 'Primary color should match brand guidelines'
      }
    ]
  },
  {
    id: 'performance-response-time',
    name: 'Response Time Performance',
    description: 'Ensure generation completes within acceptable time',
    category: 'performance',
    input: { type: 'standard_generation' },
    assertions: [
      {
        type: 'less_than',
        field: 'duration',
        value: 10000,
        message: 'Generation should complete within 10 seconds'
      }
    ]
  },
  {
    id: 'security-input-validation',
    name: 'Input Security Validation',
    description: 'Prevent malicious input from affecting generation',
    category: 'security',
    input: { malicious: '<script>alert("xss")</script>' },
    assertions: [
      {
        type: 'not_contains',
        field: 'output',
        value: '<script>',
        message: 'Malicious scripts should be sanitized'
      }
    ]
  }
];

// Global test runner instance
export const testRunner = new TestRunner();

// Add default test suite
testRunner.addTests(createAdCreativeTestSuite());