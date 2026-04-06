import analyzeLegacyModules from '../tools/analyze_legacy_modules';
import decomposeGoal from '../tools/decompose_goal';
import generateGapReport from '../tools/generate_gap_report';
import generateTestCases from '../tools/generate_test_cases';
import generateTestTemplate from '../tools/generate_test_template';
import queryGraph from '../tools/query_graph';
import readProjectStatus from '../tools/read_project_status';
import runChromeSandbox from '../tools/run_chrome_sandbox';
import runRealityScanner from '../tools/run_reality_scanner';
import updateGraphModel from '../tools/update_graph_model';

export const id = 'ai4pb-runtime-tools';

export async function server() {
  return {
    tool: {
      analyze_legacy_modules: analyzeLegacyModules,
      decompose_goal: decomposeGoal,
      generate_gap_report: generateGapReport,
      generate_test_cases: generateTestCases,
      generate_test_template: generateTestTemplate,
      query_graph: queryGraph,
      read_project_status: readProjectStatus,
      run_chrome_sandbox: runChromeSandbox,
      run_reality_scanner: runRealityScanner,
      update_graph_model: updateGraphModel,
    },
  };
}

export default {
  id,
  server,
};