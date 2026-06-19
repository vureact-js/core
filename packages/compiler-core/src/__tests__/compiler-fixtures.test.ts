import '@testing-library/jest-dom';
import path from 'node:path';
import {
  CompilerFixtureCase,
  findCompilerFixtureCases,
  runCompilerFixture,
} from './fixture-harness';

interface FixtureSuites {
  name: CompilerFixtureCase['suite'];
  root: string;
}

const srcRoot = path.resolve(__dirname, '..');

// 定义测试套件配置：指定每个套件的名称和 fixture 用例的根目录
const fixtureSuites: FixtureSuites[] = [
  {
    name: 'parse' as const,
    root: path.join(srcRoot, 'core/parse/__tests__'),
  },
  {
    name: 'transform' as const,
    root: path.join(srcRoot, 'core/transform/__tests__'),
  },
];

// 将各个套件的所有 fixture 用例扁平化合并到一个数组中
const fixtureCases = fixtureSuites.flatMap((suite) =>
  findCompilerFixtureCases(suite.root, suite.name),
);

describe('compiler fixture output', () => {
  // 对每个 fixture 用例执行参数化测试，检查输出是否与预期一致
  test.each(fixtureCases)('$name matches expected output', (testCase) => {
    runCompilerFixture(testCase);
  });
});
