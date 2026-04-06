import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

import { tool } from '@opencode-ai/plugin';

import { asJson } from '../lib/runtimeState';

function normalizeWorkspacePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function createChromeSandboxBootstrap(tempDir: string): string {
  const bootstrapPath = path.join(tempDir, 'chrome-sandbox-bootstrap.cjs');
  const bootstrapSource = String.raw`
const createAsyncStub = (result) => {
  return (...args) => {
    const callback = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;
    if (callback) {
      callback(result);
    }
    return Promise.resolve(result);
  };
};

const runtimeListeners = [];
const messageListeners = [];

const sandboxState = {
  tabs: [],
  messages: [],
  storageLocal: {},
  storageSync: {},
  runtimeListeners,
  messageListeners,
};

globalThis.__chromeSandboxState = sandboxState;

globalThis.chrome = {
  runtime: {
    id: process.env.CHROME_EXTENSION_ID || 'ai4pb-test-extension',
    lastError: undefined,
    getManifest: () => ({ manifest_version: 3, name: 'AI4PB Chrome Sandbox' }),
    onInstalled: { addListener: (listener) => runtimeListeners.push(listener) },
    onMessage: { addListener: (listener) => messageListeners.push(listener) },
    sendMessage: async (message) => {
      sandboxState.messages.push(message);
      for (const listener of messageListeners) {
        listener(message, { id: 'sandbox-sender' }, () => undefined);
      }
      return undefined;
    },
  },
  storage: {
    local: {
      async get(keys) {
        if (!keys) {
          return { ...sandboxState.storageLocal };
        }
        const requestedKeys = Array.isArray(keys) ? keys : Object.keys(keys);
        const response = {};
        for (const key of requestedKeys) {
          response[key] = sandboxState.storageLocal[key] ?? (keys && !Array.isArray(keys) ? keys[key] : undefined);
        }
        return response;
      },
      async set(values) {
        Object.assign(sandboxState.storageLocal, values || {});
      },
      async remove(keys) {
        for (const key of [].concat(keys || [])) {
          delete sandboxState.storageLocal[key];
        }
      },
      async clear() {
        sandboxState.storageLocal = {};
      },
    },
    sync: {
      async get(keys) {
        if (!keys) {
          return { ...sandboxState.storageSync };
        }
        const requestedKeys = Array.isArray(keys) ? keys : Object.keys(keys);
        const response = {};
        for (const key of requestedKeys) {
          response[key] = sandboxState.storageSync[key] ?? (keys && !Array.isArray(keys) ? keys[key] : undefined);
        }
        return response;
      },
      async set(values) {
        Object.assign(sandboxState.storageSync, values || {});
      },
      async remove(keys) {
        for (const key of [].concat(keys || [])) {
          delete sandboxState.storageSync[key];
        }
      },
      async clear() {
        sandboxState.storageSync = {};
      },
    },
  },
  tabs: {
    async query(queryInfo = {}) {
      return sandboxState.tabs.filter((tab) => {
        if (queryInfo.active !== undefined && tab.active !== queryInfo.active) {
          return false;
        }
        if (queryInfo.currentWindow !== undefined && tab.currentWindow !== queryInfo.currentWindow) {
          return false;
        }
        return true;
      });
    },
    async create(createProperties = {}) {
      const tab = {
        id: sandboxState.tabs.length + 1,
        active: true,
        currentWindow: true,
        ...createProperties,
      };
      sandboxState.tabs.push(tab);
      return tab;
    },
    async update(tabId, updateProperties = {}) {
      const existing = sandboxState.tabs.find((tab) => tab.id === tabId);
      if (!existing) {
        return undefined;
      }
      Object.assign(existing, updateProperties);
      return existing;
    },
    async remove(tabIds) {
      const ids = new Set([].concat(tabIds || []));
      sandboxState.tabs = sandboxState.tabs.filter((tab) => !ids.has(tab.id));
    },
    reload: createAsyncStub(undefined),
    sendMessage: async (tabId, message) => {
      sandboxState.messages.push({ tabId, message });
      return undefined;
    },
  },
  scripting: {
    executeScript: createAsyncStub([]),
    insertCSS: createAsyncStub(undefined),
  },
  alarms: {
    create: createAsyncStub(undefined),
    clear: createAsyncStub(true),
  },
  action: {
    setBadgeText: createAsyncStub(undefined),
    setIcon: createAsyncStub(undefined),
  },
};
`;

  fs.writeFileSync(bootstrapPath, bootstrapSource.trimStart(), 'utf8');
  return bootstrapPath;
}

export default tool({
  description: 'Run a Node-based Chrome extension test script inside a sandbox that preloads a mock global chrome object and Chrome-specific environment variables.',
  args: {
    testScriptFile: tool.schema.string().describe('Workspace-relative or absolute path to the Node-executable test script file.'),
  },
  async execute(args, context) {
    const requestedPath = normalizeWorkspacePath(args.testScriptFile);
    const scriptPath = path.isAbsolute(requestedPath)
      ? requestedPath
      : path.join(context.worktree, requestedPath);

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Chrome sandbox test script not found: ${args.testScriptFile}`);
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai4pb-chrome-sandbox-'));
    const bootstrapPath = createChromeSandboxBootstrap(tempDir);
    const execution = spawnSync(process.execPath, ['-r', bootstrapPath, scriptPath], {
      cwd: context.worktree,
      encoding: 'utf8',
      env: {
        ...process.env,
        AI4PB_TEST_ENV: 'chrome-extension',
        AI4PB_CHROME_SANDBOX: '1',
        CHROME_EXTENSION_ID: 'ai4pb-test-extension',
      },
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });

    const result = {
      status: execution.status === 0 ? 'passed' : 'failed',
      command: [process.execPath, '-r', bootstrapPath, scriptPath],
      testScriptFile: path.relative(context.worktree, scriptPath).replace(/\\/g, '/'),
      exitCode: execution.status ?? -1,
      stdout: execution.stdout?.trim() ?? '',
      stderr: execution.stderr?.trim() ?? '',
      sandbox: {
        environmentProfile: 'chrome-extension',
        mockedGlobal: 'chrome',
        env: ['AI4PB_TEST_ENV', 'AI4PB_CHROME_SANDBOX', 'CHROME_EXTENSION_ID'],
      },
    };

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup failures for sandbox temp files.
    }

    return asJson(result);
  },
});