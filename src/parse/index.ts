import { logger } from '@transform/utils/logger';
import { isNull } from '@utils/types';
import {
  parse as parseSFC,
  type SFCScriptBlock,
  type SFCStyleBlock,
  type SFCTemplateBlock,
} from '@vue/compiler-sfc';
import { cyan } from 'colorette';
import { extractScriptDependencies, parseScript } from './script';
import { parseTemplate } from './template';
import type { ExtendedRootNode, ParseOptions, ParsedResult, ScriptInfo, StyleInfo } from './types';
import { generateComponentName, parseStyle } from './utils';

// 统一解析入口函数，解析 Vue SFC 或独立模板
// Main parse entry function for Vue SFC or standalone templates
export default function parser(content: string, options: ParseOptions = {}): ParsedResult {
  validateInput(content, options);

  const { descriptor: sfcDescriptor } = parseSFC(content, options);
  const { template, script, scriptSetup, styles } = sfcDescriptor;

  logger.addContext(options.filename!, template?.loc.source!);

  const fileAst = buildBaseAST();

  const templateAst = parseTemplate(template?.content, options);
  const { scriptContent, scriptLang } = processScriptContent(script, scriptSetup);
  const scriptAst = parseScript(scriptContent, scriptLang, fileAst.template?.nonReactivies);

  const allStyleAst = processStyles(styles);

  assembleAstResults({
    fileAst,
    templateAst,
    scriptAst,
    allStyleAst,
    scriptLang,
    scriptContent,
  });

  processName(fileAst, template, script, scriptSetup, options);
  processDependencies(fileAst, options);

  logger.printAll();

  return fileAst;
}

function validateInput(content: string, { filename }: ParseOptions) {
  const isSFC = /<\/template>|<\/script>|<\/style>/i.test(content);
  if (!isSFC) {
    throw `${filename} parse failed, the file content must be Vue SFC`;
  }
}

function buildBaseAST(): ParsedResult {
  return {
    filename: '',
    componentName: '',
    template: null,
    script: null,
    styles: [],
  };
}

function processScriptContent(
  script: SFCScriptBlock | null,
  scriptSetup: SFCScriptBlock | null,
): { scriptContent: string; scriptLang: string } {
  let scriptContent = '';
  let scriptLang = 'js';

  if (scriptSetup?.content) {
    scriptContent = scriptSetup.content;
    scriptLang = scriptSetup.lang ?? 'js';
  } else if (script?.content) {
    scriptContent = script.content;
    scriptLang = script.lang ?? 'js';
  }

  return { scriptContent, scriptLang };
}

function processStyles(styles: SFCStyleBlock[]): StyleInfo[] {
  return styles
    .map((style) => {
      const ast = parseStyle(style.content, {
        scoped: !!style.scoped,
        module: !!style.module,
        lang: style.lang ?? 'css',
      });
      return !isNull(ast) ? ast : false;
    })
    .filter(Boolean) as StyleInfo[];
}

function assembleAstResults(data: {
  fileAst: ParsedResult;
  templateAst: ExtendedRootNode | null;
  scriptAst: ScriptInfo['file'] | null;
  allStyleAst: StyleInfo[];
  scriptLang: string;
  scriptContent: string;
}) {
  const { fileAst, templateAst, scriptAst, allStyleAst, scriptLang, scriptContent } = data;
  if (!isNull(templateAst)) {
    fileAst.template = templateAst;
  }
  if (!isNull(scriptAst)) {
    fileAst.script = {
      file: scriptAst,
      lang: scriptLang,
      sourceCode: scriptContent,
    };
  }
  if (allStyleAst.length) {
    fileAst.styles = allStyleAst;
  }
}

function processName(
  fileAst: ParsedResult,
  template: SFCTemplateBlock | null,
  script: SFCScriptBlock | null,
  scriptSetup: SFCScriptBlock | null,
  options: ParseOptions,
) {
  const key = 'react-name';
  const name = (template?.attrs[key] ?? script?.attrs[key] ?? scriptSetup?.attrs[key]) as string;
  fileAst.componentName = generateComponentName(name);
  fileAst.filename = options.filename ?? '';
}

function processDependencies(fileAst: ParsedResult, options: ParseOptions) {
  const filename = cyan(options.filename!);
  if (isNull(fileAst.template)) {
    logger.info(`Found that ${filename} has no template content`);
    return;
  }
  if (isNull(fileAst.script)) {
    logger.info(`Found that ${filename} has no script content`);
    return;
  }

  const { dependencies: templateDeps } = fileAst.template;
  const scriptDeps = extractScriptDependencies(fileAst.script.file);
  const styleDeps = fileAst.styles.flatMap((s) => s.dependencies!);

  scriptDeps.forEach((dep) => templateDeps.add(dep));
  styleDeps.forEach((d) => {
    fileAst.template!.dependencies = templateDeps!.union(d);
  });
}
