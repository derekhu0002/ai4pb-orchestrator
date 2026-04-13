import analyzeLegacyModules from '../tools/analyze_legacy_modules';
import decomposeGoal from '../tools/decompose_goal';
import generateGapReport from '../tools/generate_gap_report';
import generateTestCases from '../tools/generate_test_cases';
import generateTestTemplate from '../tools/generate_test_template';
import generateTraceabilityMatrix from '../tools/generate_traceability_matrix';
import queryGraph from '../tools/query_graph';
import readProjectStatus from '../tools/read_project_status';
import runChromeSandbox from '../tools/run_chrome_sandbox';
import runRealityScanner from '../tools/run_reality_scanner';
import scanLegacyTopology from '../tools/scan_legacy_topology';
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
      generate_traceability_matrix: generateTraceabilityMatrix,
      query_graph: queryGraph,
      read_project_status: readProjectStatus,
      run_chrome_sandbox: runChromeSandbox,
      run_reality_scanner: runRealityScanner,
      scan_legacy_topology: scanLegacyTopology,
      update_graph_model: updateGraphModel,
    },
  };
}

export default {
  id,
  server,
};