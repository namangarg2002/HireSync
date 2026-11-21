import React from 'react';

const normalizeLine = (line = '') =>
  String(line)
    .trim()
    .replace(/['"]/g, '')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ');

const buildTestCases = (actualOutput = '', expectedOutput = '') => {
  const actualLines = String(actualOutput)
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const expectedLines = String(expectedOutput)
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const total = expectedLines.length > 0 ? expectedLines.length : actualLines.length;
  const cases = [];

  for (let i = 0; i < total; i++) {
    const rawActual = actualLines[i] ?? '(No output)';
    const rawExpected = expectedLines[i] ?? '(No expected output)';
    const passed =
      actualLines[i] !== undefined &&
      expectedLines[i] !== undefined &&
      normalizeLine(rawActual) === normalizeLine(rawExpected);

    cases.push({
      testCase: i + 1,
      passed,
      actual: rawActual,
      expected: rawExpected,
    });
  }

  return cases;
};

function OutputPanel({ output, expectedOutput }) {
  console.log('This is Outpt for OutputPanel', output);

  const testCases =
    output?.success && expectedOutput
      ? buildTestCases(output.output, expectedOutput)
      : [];

  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-4 py-2 bg-base-200 border-b border-base-300 font-semibold text-sm flex items-center justify-between">
        <span>Output</span>
        {testCases.length > 0 && (
          <span className="text-xs font-normal opacity-80">
            {testCases.filter((tc) => tc.passed).length} / {testCases.length} Right
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {output === null ? (
          <p className="text-base-content/50 text-sm">
            Click "Run Code" to see the output here...
          </p>
        ) : output.success ? (
          testCases.length > 0 ? (
            <div className="space-y-2">
              {testCases.map((tc) => (
                <div
                  key={tc.testCase}
                  className={`px-3 py-2 rounded border text-xs ${
                    tc.passed
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-error/40 bg-error/10 text-error'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>Test Case {tc.testCase}</span>
                    <span>{tc.passed ? 'Right' : 'Wrong'}</span>
                  </div>
                  {!tc.passed && (
                    <div className="mt-1 font-mono text-base-content space-y-0.5">
                      <div>Expected: {tc.expected}</div>
                      <div>Actual: {tc.actual}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-sm font-mono text-success whitespace-pre-wrap">
              {output.output}
            </pre>
          )
        ) : (
          <div>
            {output && (
              <pre className="text-sm font-mono text-base-content whitespace-pre-wrap mb-2">
                {output.output}
              </pre>
            )}
            <pre className="text-sm font-mono text-error whitespace-pre-wrap">
              {output.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default OutputPanel;