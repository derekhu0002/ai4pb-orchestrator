(function () {
  const vscode = typeof acquireVsCodeApi === 'function'
    ? acquireVsCodeApi()
    : { postMessage() {}, setState() {} };

  function getElement(id) {
    return document.getElementById(id);
  }

  const bootStatus = getElement('bootStatus');
  function setBootStatus(text, kind) {
    if (!bootStatus) {
      return;
    }
    bootStatus.textContent = text;
    bootStatus.className = 'boot-banner' + (kind ? ' ' + kind : '');
  }

  function readJsonTemplate(id, fallbackValue) {
    const node = getElement(id);
    if (!node) {
      return fallbackValue;
    }

    try {
      const raw = node.tagName === 'TEMPLATE' && node.content
        ? String(node.content.textContent || '')
        : String(node.textContent || '');
      return JSON.parse(raw);
    } catch (error) {
      setBootStatus('BOOT: json-error - ' + id, 'error');
      return fallbackValue;
    }
  }

  setBootStatus('BOOT: script-started', 'ok');
  window.addEventListener('error', function (event) {
    const message = event && event.message ? event.message : 'unknown error';
    setBootStatus('BOOT: error - ' + message, 'error');
  });
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event && event.reason ? String(event.reason) : 'unknown rejection';
    setBootStatus('BOOT: rejection - ' + reason, 'error');
  });

  const flows = readJsonTemplate('workflow-data-flows', []);
  const helpUrls = readJsonTemplate('workflow-data-help-urls', { menu: {}, flow: {}, step: {}, config: {} });
  const initialState = readJsonTemplate('workflow-data-initial-state', {});
  const skillAgentLabels = readJsonTemplate('workflow-data-skill-agents', {});

  const thread = getElement('thread');
  const skillsContainer = getElement('skills');
  const skillMeta = getElement('skillMeta');
  const promptInput = getElement('promptInput');
  const sendBtn = getElement('sendBtn');
  const sendHelpBtn = getElement('sendHelpBtn');

  if (!thread || !skillsContainer || !skillMeta || !promptInput || !sendBtn || !sendHelpBtn) {
    setBootStatus('BOOT: missing-required-dom', 'error');
    return;
  }

  const state = {
    selectedFlow: typeof initialState.selectedFlow === 'string' ? initialState.selectedFlow : null,
    selectedSkill: typeof initialState.selectedSkill === 'string' ? initialState.selectedSkill : null,
    draftText: typeof initialState.draftText === 'string' ? initialState.draftText : '',
    thread: Array.isArray(initialState.thread) ? initialState.thread : []
  };

  const activeStreams = new Map();

  function getAgentLabelForSkill(skillKey) {
    if (!skillKey) {
      return '当前代理';
    }
    return skillAgentLabels[skillKey] || '当前代理';
  }

  function getCurrentFlow() {
    if (!state.selectedFlow) {
      return null;
    }
    return flows.find(function (flow) { return flow.key === state.selectedFlow; }) || null;
  }

  function getCurrentStep() {
    const flow = getCurrentFlow();
    if (!flow || !Array.isArray(flow.steps)) {
      return null;
    }
    return flow.steps.find(function (step) { return step.key === state.selectedSkill; }) || null;
  }

  function getSyncPayload() {
    return {
      activeMenu: state.selectedSkill ? 'flow' : 'auto',
      confirmedMenu: state.selectedSkill ? 'flow' : 'auto',
      menuOpen: false,
      expandedConfig: false,
      expandedFlow: state.selectedFlow,
      selectedFlow: state.selectedFlow,
      selectedSkill: state.selectedSkill,
      draftText: state.draftText,
      thread: state.thread
    };
  }

  function syncState() {
    const payload = getSyncPayload();
    vscode.setState(payload);
    vscode.postMessage({ type: 'syncState', state: payload });
  }

  function scrollThreadToBottom() {
    thread.scrollTop = thread.scrollHeight;
  }

  function createBubbleNode(role, text) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + role;
    bubble.textContent = String(text || '');
    return bubble;
  }

  function appendBubble(role, text, skipPersist) {
    const bubble = createBubbleNode(role, text);
    thread.appendChild(bubble);
    scrollThreadToBottom();

    if (!skipPersist) {
      state.thread.push({ kind: 'bubble', role: role, text: String(text || '') });
      syncState();
    }

    return bubble;
  }

  function appendAutoSuggestion(message, skipPersist) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble ai';

    const card = document.createElement('div');
    card.className = 'confirm-card';
    const title = document.createElement('div');
    title.textContent = '建议执行以下动作，请选择一个确认发送：';
    card.appendChild(title);

    const suggestions = Array.isArray(message.suggestions) ? message.suggestions : [];
    suggestions.forEach(function (suggestion, index) {
      const option = document.createElement('div');
      option.className = 'confirm-card';

      const optionTitle = document.createElement('div');
      optionTitle.textContent = String(index + 1) + '. ' + suggestion.skillLabel;
      option.appendChild(optionTitle);

      const reason = document.createElement('div');
      reason.className = 'confirm-reason';
      reason.textContent = '分析依据: ' + (suggestion.reason || '已根据输入内容完成自动分析。');
      option.appendChild(reason);

      const btn = document.createElement('button');
      btn.className = 'confirm-btn';
      btn.textContent = '确认执行';
      btn.addEventListener('click', function () {
        vscode.postMessage({ type: 'autoConfirm', text: message.text, skill: suggestion.skill });
        btn.disabled = true;
        btn.textContent = '已确认，正在发送...';
      });
      option.appendChild(btn);
      card.appendChild(option);
    });

    bubble.appendChild(card);
    thread.appendChild(bubble);
    scrollThreadToBottom();

    if (!skipPersist) {
      state.thread.push({
        kind: 'autoSuggestion',
        text: String(message.text || ''),
        suggestions: suggestions.map(function (suggestion) {
          return {
            skill: suggestion.skill,
            skillLabel: suggestion.skillLabel,
            promptRef: suggestion.promptRef,
            reason: suggestion.reason || ''
          };
        })
      });
      syncState();
    }
  }

  function updateSkillMeta() {
    const currentFlow = getCurrentFlow();
    const currentStep = getCurrentStep();

    if (currentFlow && currentStep) {
      skillMeta.textContent = '当前工作状态: 已确认流程 / ' + currentFlow.label + ' / ' + currentStep.label + ' / ' + getAgentLabelForSkill(currentStep.key);
      return;
    }

    skillMeta.textContent = '当前工作状态: 智能路由';
  }

  function updateSendButtonLabel() {
    sendBtn.textContent = state.selectedSkill ? ('发送至 ' + getAgentLabelForSkill(state.selectedSkill)) : '发送至当前代理';
  }

  function renderConfigActions(container) {
    const row = document.createElement('div');
    row.className = 'config-toggle-row';

    function addConfigButton(label, key) {
      const button = document.createElement('button');
      button.className = 'quick-btn';
      button.textContent = label;
      button.addEventListener('click', function () {
        vscode.postMessage({ type: 'statusAction', key: key });
      });
      row.appendChild(button);
    }

    addConfigButton('EA模板初始化', 'init');
    addConfigButton('EA导出参数配置', 'options');
    addConfigButton('参数查询', 'queryOptions');
    container.appendChild(row);
  }

  function renderFlowSections(container) {
    flows.forEach(function (flow) {
      const panel = document.createElement('div');
      panel.className = 'flow-panel' + (state.selectedFlow === flow.key ? ' current' : '');

      const header = document.createElement('div');
      header.className = 'flow-panel-header';
      const title = document.createElement('div');
      title.className = 'flow-panel-title';
      title.textContent = flow.label;
      header.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'flow-panel-desc';
      desc.textContent = flow.description || '';
      header.appendChild(desc);
      panel.appendChild(header);

      const row = document.createElement('div');
      row.className = 'flow-step-row';
      (flow.steps || []).forEach(function (step, index) {
        const button = document.createElement('button');
        const isActive = state.selectedFlow === flow.key && state.selectedSkill === step.key;
        button.className = 'skill-chip flow-step' + (isActive ? ' active' : '');
        button.textContent = String(index + 1) + '. ' + step.label + ' · ' + getAgentLabelForSkill(step.key);
        button.addEventListener('click', function () {
          state.selectedFlow = flow.key;
          state.selectedSkill = step.key;
          updateSkillMeta();
          updateSendButtonLabel();
          renderSkills();
          syncState();
        });
        row.appendChild(button);
      });
      panel.appendChild(row);
      container.appendChild(panel);
    });
  }

  function renderSkills() {
    skillsContainer.innerHTML = '';

    const topRow = document.createElement('div');
    topRow.className = 'config-toggle-row';

    const autoBtn = document.createElement('button');
    autoBtn.className = 'quick-btn';
    autoBtn.textContent = '智能路由';
    autoBtn.addEventListener('click', function () {
      state.selectedFlow = null;
      state.selectedSkill = null;
      updateSkillMeta();
      updateSendButtonLabel();
      renderSkills();
      syncState();
    });
    topRow.appendChild(autoBtn);
    skillsContainer.appendChild(topRow);

    renderConfigActions(skillsContainer);
    renderFlowSections(skillsContainer);
  }

  function ensureStreamBubble(streamId, label) {
    let entry = activeStreams.get(streamId);
    if (entry) {
      return entry;
    }

    const bubble = appendBubble('ai', '[' + String(label || 'OpenCode') + ']\nOpenCode 正在准备内容...', true);
    entry = { bubble: bubble, label: String(label || 'OpenCode'), content: { thinking: '', response: '', errorText: '' } };
    activeStreams.set(streamId, entry);
    return entry;
  }

  function renderStreamEntry(entry, status) {
    const parts = [];
    if (entry.content.response) {
      parts.push(entry.content.response);
    }
    if (entry.content.thinking) {
      parts.push('[thinking]\n' + entry.content.thinking);
    }
    if (entry.content.errorText) {
      parts.push('[error]\n' + entry.content.errorText);
    }
    entry.bubble.textContent = '[' + entry.label + (status ? ' / ' + status : '') + ']\n' + (parts.join('\n\n') || 'OpenCode 正在准备内容...');
  }

  function updateStreamBubble(streamId, label, content) {
    const entry = ensureStreamBubble(streamId, label);
    entry.label = String(label || entry.label || 'OpenCode');
    entry.content = {
      thinking: content && typeof content.thinking === 'string' ? content.thinking : '',
      response: content && typeof content.response === 'string' ? content.response : '',
      errorText: content && typeof content.errorText === 'string' ? content.errorText : ''
    };
    renderStreamEntry(entry, content && typeof content.status === 'string' ? content.status : 'streaming');
    scrollThreadToBottom();
  }

  function finishStreamBubble(streamId, label, content, status) {
    const entry = ensureStreamBubble(streamId, label);
    updateStreamBubble(streamId, label, content || {});
    renderStreamEntry(entry, status || 'completed');
    activeStreams.delete(streamId);
    state.thread.push({
      kind: 'streamBubble',
      stream: {
        label: entry.label,
        thinking: entry.content.thinking,
        response: entry.content.response,
        errorText: entry.content.errorText,
        status: status === 'failed' ? 'failed' : 'completed'
      }
    });
    syncState();
  }

  function restoreThread() {
    const items = Array.isArray(state.thread) ? state.thread : [];
    if (items.length === 0) {
      appendBubble('ai', '欢迎使用 AI4PB Skill Chat。可以手动选择流程按钮，或直接输入自然语言由系统自动路由。', true);
      return;
    }

    items.forEach(function (item) {
      if (!item || typeof item !== 'object') {
        return;
      }

      if (item.kind === 'bubble') {
        appendBubble(item.role === 'user' ? 'user' : 'ai', item.text, true);
        return;
      }

      if (item.kind === 'streamBubble' && item.stream) {
        const text = [item.stream.response, item.stream.thinking, item.stream.errorText].filter(Boolean).join('\n\n');
        appendBubble('ai', '[' + (item.stream.label || 'OpenCode') + ']\n' + text, true);
        return;
      }

      if (item.kind === 'autoSuggestion') {
        appendAutoSuggestion(item, true);
      }
    });

    scrollThreadToBottom();
  }

  function sendRequest() {
    const text = String(promptInput.value || '').trim();
    if (!text && !state.selectedSkill) {
      appendBubble('ai', '请输入业务诉求，或先选择一个流程环节。');
      return;
    }

    appendBubble('user', text || '[使用所选流程环节直接开始]');
    vscode.postMessage({ type: 'chatRequest', text: text, skill: state.selectedSkill || undefined });
    promptInput.value = '';
    state.draftText = '';
    syncState();
  }

  window.addEventListener('message', function (event) {
    const message = event.data || {};
    if (message.type === 'updateState' && message.state) {
      state.selectedFlow = message.state.selectedFlow || null;
      state.selectedSkill = message.state.selectedSkill || null;
      state.draftText = typeof message.state.draftText === 'string' ? message.state.draftText : '';
      state.thread = Array.isArray(message.state.thread) ? message.state.thread : [];
      activeStreams.clear();
      thread.innerHTML = '';
      restoreThread();
      promptInput.value = state.draftText;
      renderSkills();
      updateSkillMeta();
      updateSendButtonLabel();
      return;
    }
    if (message.type === 'autoSuggestion') {
      appendAutoSuggestion(message);
      return;
    }
    if (message.type === 'configSummary') {
      appendBubble('ai', String(message.text || '当前未读取到参数配置。'));
      return;
    }
    if (message.type === 'autoDispatchDone') {
      appendBubble('ai', '已确认并发送到' + getAgentLabelForSkill(message.skill) + '，执行技能: ' + message.skillLabel + '。');
      return;
    }
    if (message.type === 'autoAnalysisError') {
      appendBubble('ai', message.message || '智能路由分析失败，请重试或手动选择流程环节。');
      return;
    }
    if (message.type === 'opencodeStreamStart') {
      ensureStreamBubble(message.streamId, message.label);
      return;
    }
    if (message.type === 'opencodeStreamUpdate') {
      updateStreamBubble(message.streamId, message.label, message.content || {});
      return;
    }
    if (message.type === 'opencodeStreamEnd') {
      finishStreamBubble(message.streamId, message.label, message.content || {}, message.status === 'failed' ? 'failed' : 'completed');
    }
  });

  sendBtn.addEventListener('click', sendRequest);
  sendHelpBtn.addEventListener('click', function () {
    if (helpUrls && helpUrls.menu && helpUrls.menu.send) {
      vscode.postMessage({ type: 'openHelp', url: helpUrls.menu.send });
    }
  });
  promptInput.addEventListener('input', function () {
    state.draftText = String(promptInput.value || '');
    syncState();
  });
  promptInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendRequest();
    }
  });

  promptInput.value = state.draftText;
  restoreThread();
  renderSkills();
  updateSkillMeta();
  updateSendButtonLabel();
  setBootStatus('BOOT: ui-ready', 'ok');
})();