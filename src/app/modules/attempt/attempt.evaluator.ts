import vm from 'vm';

interface IMcqOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface ICodingTestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export const evaluateMcqSubmission = (
  selectedOption: string,
  options: IMcqOption[],
  maxPoints: number,
): { awardedScore: number; isAutoEvaluated: boolean } => {
  const chosen = options.find((opt) => opt.id === selectedOption);
  const isCorrect = chosen?.isCorrect === true;

  return {
    awardedScore: isCorrect ? maxPoints : 0,
    isAutoEvaluated: true,
  };
};

export const evaluateCodingSubmission = (
  sourceCode: string,
  testCases: ICodingTestCase[],
  maxPoints: number,
): { passedTestCases: number; totalTestCases: number; awardedScore: number; isAutoEvaluated: boolean } => {
  const total = testCases.length;
  if (total === 0 || !sourceCode) {
    return {
      passedTestCases: 0,
      totalTestCases: total,
      awardedScore: 0,
      isAutoEvaluated: true,
    };
  }

  let passed = 0;

  for (const tc of testCases) {
    try {
      const sandbox: Record<string, unknown> = {
        result: undefined,
      };

      const scriptCode = `
        ${sourceCode}
        try {
          const fn = Object.values(this).find(v => typeof v === 'function');
          if (fn) {
            result = fn(${tc.input});
          }
        } catch (e) {
          result = undefined;
        }
      `;

      const context = vm.createContext(sandbox);
      const script = new vm.Script(scriptCode);
      script.runInContext(context, { timeout: 1000 });

      const actualOutput = JSON.stringify(sandbox.result);
      let expectedOutput = tc.expectedOutput.trim();

      try {
        expectedOutput = JSON.stringify(JSON.parse(expectedOutput));
      } catch {
        // Keep as string comparison if not valid JSON
      }

      if (actualOutput === expectedOutput) {
        passed++;
      }
    } catch {
      // Test case execution failed / timed out
    }
  }

  const score = total > 0 ? (passed / total) * maxPoints : 0;

  return {
    passedTestCases: passed,
    totalTestCases: total,
    awardedScore: Math.round(score * 100) / 100,
    isAutoEvaluated: true,
  };
};
