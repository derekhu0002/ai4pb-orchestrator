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

  const restoredState = initialState;
  const state = {
    activeMenu: restoredState.activeMenu || (restoredState.expandedConfig ? 'config' : (restoredState.selectedFlow || restoredState.expandedFlow ? 'flow' : 'auto')),
    confirmedMenu: restoredState.confirmedMenu === 'auto' || restoredState.confirmedMenu === 'flow'
      ? restoredState.confirmedMenu
      : 'auto',
    menuOpen: restoredState.menuOpen === true,
    expandedConfig: restoredState.expandedConfig === true,
    expandedFlow: restoredState.expandedFlow || restoredState.selectedFlow || null,
    selectedFlow: restoredState.selectedFlow || null,
    selectedSkill: restoredState.selectedSkill || null,
    draftText: String(restoredState.draftText || ''),
    thread: Array.isArray(restoredState.thread) ? restoredState.thread : []
  };

  const activeStreams = new Map();

  function getStatusIcon(kind) {
    if (kind === 'mode') {
      return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    }
    if (kind === 'flow') {
      return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4h10M3 8h7M3 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    }
    if (kind === 'step') {
      return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (kind === 'hint') {
      return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2.1v3.1m0 2.25h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.4"/></svg>';
  }

  function getPrimaryMenuIcon(menuKey) {
    if (menuKey === 'config') {
      return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.4 2.5h3.2l.4 1.5c.3.1.7.3 1 .5l1.4-.6 1.6 1.6-.6 1.4c.2.3.4.7.5 1l1.5.4v3.2l-1.5.4c-.1.3-.3.7-.5 1l.6 1.4-1.6 1.6-1.4-.6c-.3.2-.7.4-1 .5l-.4 1.5H6.4L6 13.9c-.3-.1-.7-.3-1-.5l-1.4.6L2 12.4l.6-1.4c-.2-.3-.4-.7-.5-1L1 9.6V6.4L2.5 6c.1-.3.3-.7.5-1L2.4 3.6 4 2l1.4.6c.3-.2.7-.4 1-.5l.4-1.5Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><circle cx="8" cy="8" r="2.1" stroke="currentColor" stroke-width="1.1"/></svg>';
    }
    return '';
  }

  function renderStatusBanner(title, items) {
    const safeItems = Array.isArray(items) ? items : [];
    const chips = safeItems.map(function (item) {
      return '<span class="status-chip ' + item.kind + '">' + getStatusIcon(item.kind) + '<span>' + item.text + '</span></span>';
    }).join('');

    skillMeta.innerHTML = '<div class="status-banner-title">'
      + '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.5 3 5.2v5.6L8 13.5l5-2.7V5.2L8 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 6.5h5M5.5 8.5h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
      + '<span>' + title + '</span></div>'
      + '<div class="status-banner-items">' + chips + '</div>';
  }

  function openHelp(url) {
    if (!url) {
      return;
    }
    vscode.postMessage({ type: 'openHelp', url: url });
  }

  function createHelpButton(url, title) {
    const btn = document.createElement('button');
    btn.className = 'help-btn';
    btn.textContent = '?';
    btn.title = title || '查看帮助';
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openHelp(url);
    });
    return btn;
  }

  function appendButtonWithHelp(container, button, url, title) {
    const wrapper = document.createElement('div');
    wrapper.className = 'button-with-help';
    wrapper.appendChild(button);
    if (url) {
      wrapper.appendChild(createHelpButton(url, title));
    }
    container.appendChild(wrapper);
    return wrapper;
  }

  function positionMenuPopup(contextShell, anchor) {
    if (!contextShell || !anchor) {
      return;
    }

    const containerRect = skillsContainer.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const desiredWidth = state.activeMenu === 'flow' ? 420 : 320;
    const containerWidth = Math.max(0, Math.floor(containerRect.width));
    const width = Math.max(Math.min(desiredWidth, containerWidth), Math.min(220, containerWidth));
    let left = anchorRect.left - containerRect.left;
    if (left + width > containerWidth) {
      left = Math.max(0, containerWidth - width);
    }
    if (left < 0) {
      left = 0;
    }

    contextShell.style.width = width + 'px';
    contextShell.style.left = left + 'px';
    contextShell.style.bottom = anchor.offsetHeight + 8 + 'px';
  }

  function findFlow(flowKey) {
    return flows.find(function (flow) { return flow.key === flowKey; }) || null;
  }

  function findFlowStep(flow, skillKey) {
    if (!flow) {
      return null;
    }
    return flow.steps.find(function (step) { return step.key === skillKey; }) || null;
  }

  function inferFlowForSkill(skillKey) {
    if (!skillKey) {
      return null;
    }
    return flows.find(function (flow) {
      return Array.isArray(flow.steps) && flow.steps.some(function (step) { return step.key === skillKey; });
    }) || null;
  }

  function getExpandedFlow() {
    return findFlow(state.expandedFlow) || getCurrentFlow();
  }

  function getAgentLabelForSkill(skillKey) {
    if (!skillKey) {
      return '当前代理';
    }
    return skillAgentLabels[skillKey] || '当前代理';
  }

  function getCurrentFlow() {
    return findFlow(state.selectedFlow) || inferFlowForSkill(state.selectedSkill);
  }

  function getCurrentStep() {
    return findFlowStep(getCurrentFlow(), state.selectedSkill);
  }

  function syncState() {
    vscode.setState(state);
    vscode.postMessage({ type: 'syncState', state: state });
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

  function updateSkillMetaCore() {
    if (state.confirmedMenu === 'auto') {
      renderStatusBanner('当前工作状态', [
        { kind: 'mode', text: '智能路由' },
        { kind: 'hint', text: '系统将根据输入自动匹配最合适环节' }
      ]);
      return;
    }

    const currentFlow = getCurrentFlow();
    const currentStep = getCurrentStep();
    if (state.confirmedMenu === 'flow' && currentFlow && currentStep) {
      renderStatusBanner('当前工作状态', [
        { kind: 'mode', text: '已确认流程' },
        { kind: 'flow', text: currentFlow.label },
        { kind: 'step', text: currentStep.label },
        { kind: 'hint', text: '执行代理: ' + getAgentLabelForSkill(currentStep.key) }
      ]);
      return;
    }

    renderStatusBanner('当前工作状态', [
      { kind: 'mode', text: '待确认选择' },
      { kind: 'hint', text: '请先完成子菜单选择，顶部状态再同步更新' }
    ]);
  }

  function updateSkillMeta() {
    try {
      updateSkillMetaCore();
      if (skillMeta && !String(skillMeta.textContent || '').trim()) {
        throw new Error('Status banner rendered empty.');
      }
    } catch (error) {
      if (skillMeta) {
        skillMeta.textContent = '当前工作状态: 兼容模式';
      }
    }
  }

  function updateSendButtonLabel() {
    const effectiveSkill = state.activeMenu === 'flow' ? state.selectedSkill : null;
    sendBtn.textContent = effectiveSkill ? ('发送至 ' + getAgentLabelForSkill(effectiveSkill)) : '发送至当前代理';
  }

  function togglePrimaryMenu(menuKey) {
    const isSameMenu = state.activeMenu === menuKey;
    state.activeMenu = menuKey;
    state.menuOpen = isSameMenu ? !state.menuOpen : true;

    if (menuKey === 'auto') {
      state.confirmedMenu = 'auto';
      state.expandedConfig = false;
      state.expandedFlow = null;
    } else if (menuKey === 'flow') {
      state.expandedConfig = false;
      if (!state.expandedFlow) {
        state.expandedFlow = state.selectedFlow || 'delivery';
      }
    } else if (menuKey === 'config') {
      state.expandedConfig = true;
    }

    renderSkills();
    updateSkillMeta();
    syncState();
  }

  function renderSkillsCore() {
    skillsContainer.innerHTML = '';
    const isMenuOpen = state.menuOpen === true;
    let autoAnchor = null;
    let flowAnchor = null;
    let configAnchor = null;

    const primaryRow = document.createElement('div');
    primaryRow.className = 'primary-menu-row';
    primaryRow.addEventListener('click', function (event) {
      event.stopPropagation();
    });

    const autoBtn = document.createElement('button');
    autoBtn.className = 'primary-menu-btn' + (state.activeMenu === 'auto' ? (isMenuOpen ? ' active' : ' current') : '');
    autoBtn.textContent = '智能路由';
    autoBtn.addEventListener('click', function () {
      togglePrimaryMenu('auto');
    });
    autoAnchor = appendButtonWithHelp(primaryRow, autoBtn, helpUrls.menu.auto, '查看智能路由帮助');

    const flowMenuBtn = document.createElement('button');
    flowMenuBtn.className = 'primary-menu-btn' + (state.activeMenu === 'flow' ? (isMenuOpen ? ' active' : ' current') : '');
    flowMenuBtn.textContent = '流程导航';
    flowMenuBtn.addEventListener('click', function () {
      togglePrimaryMenu('flow');
    });
    flowAnchor = appendButtonWithHelp(primaryRow, flowMenuBtn, helpUrls.menu.flow, '查看流程导航帮助');

    const configMenuBtn = document.createElement('button');
    configMenuBtn.className = 'primary-menu-btn' + (state.activeMenu === 'config' ? (isMenuOpen ? ' active' : ' current') : '');
    configMenuBtn.innerHTML = getPrimaryMenuIcon('config') + '<span>配置中心</span>';
    configMenuBtn.addEventListener('click', function () {
      togglePrimaryMenu('config');
    });
    configAnchor = appendButtonWithHelp(primaryRow, configMenuBtn, helpUrls.menu.config, '查看配置中心帮助');

    const contextShell = document.createElement('div');
    contextShell.className = 'menu-context-shell' + (isMenuOpen ? '' : ' hidden');
    contextShell.addEventListener('click', function (event) {
      event.stopPropagation();
    });
    skillsContainer.appendChild(contextShell);
    skillsContainer.appendChild(primaryRow);

    if (!isMenuOpen) {
      return;
    }

    const activeAnchor = state.activeMenu === 'flow'
      ? flowAnchor
      : state.activeMenu === 'config'
        ? configAnchor
        : autoAnchor;

    positionMenuPopup(contextShell, activeAnchor);

    if (state.activeMenu === 'auto') {
      const panel = document.createElement('div');
      panel.className = 'auto-panel';

      const title = document.createElement('div');
      title.className = 'auto-panel-title';
      title.textContent = '智能路由';
      panel.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'auto-panel-desc';
      desc.textContent = '根据你的输入自动匹配最合适的 SCRUM 环节。若你已经明确知道当前所处流程，可切换到“流程导航”直接选择具体环节。';
      panel.appendChild(desc);

      contextShell.appendChild(panel);
      return;
    }

    if (state.activeMenu === 'config') {
      const panel = document.createElement('div');
      panel.className = 'config-panel';

      const title = document.createElement('div');
      title.className = 'config-panel-title';
      title.textContent = '环境配置';
      panel.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'config-panel-desc';
      desc.textContent = '集中处理 EA 模板初始化与导出参数配置。';
      panel.appendChild(desc);

      const actions = document.createElement('div');
      actions.className = 'config-toggle-row';

      const initBtn = document.createElement('button');
      initBtn.className = 'quick-btn';
      initBtn.textContent = 'EA模板初始化';
      initBtn.addEventListener('click', function () {
        state.menuOpen = false;
        appendBubble('user', '[执行 EA 模板初始化]');
        vscode.postMessage({ type: 'statusAction', key: 'init' });
        renderSkills();
        syncState();
      });
      appendButtonWithHelp(actions, initBtn, helpUrls.config.init, '查看 EA 模板初始化帮助');

      const configBtn = document.createElement('button');
      configBtn.className = 'quick-btn';
      configBtn.textContent = 'EA导出参数配置';
      configBtn.addEventListener('click', function () {
        state.menuOpen = false;
        appendBubble('user', '[打开 EA 导出参数配置]');
        vscode.postMessage({ type: 'statusAction', key: 'options' });
        renderSkills();
        syncState();
      });
      appendButtonWithHelp(actions, configBtn, helpUrls.config.options, '查看 EA 导出参数配置帮助');

      const queryBtn = document.createElement('button');
      queryBtn.className = 'quick-btn';
      queryBtn.textContent = '参数查询';
      queryBtn.addEventListener('click', function () {
        state.menuOpen = false;
        appendBubble('user', '[查询当前导出参数]');
        vscode.postMessage({ type: 'statusAction', key: 'queryOptions' });
        renderSkills();
        syncState();
      });
      appendButtonWithHelp(actions, queryBtn, helpUrls.config.query, '查看参数查询帮助');

      panel.appendChild(actions);
      contextShell.appendChild(panel);
      return;
    }

    const toggleRow = document.createElement('div');
    toggleRow.className = 'flow-toggle-row';

    flows.forEach(function (flow) {
      const toggle = document.createElement('button');
      const isCurrentFlow = state.selectedFlow === flow.key;
      const isExpanded = state.expandedFlow === flow.key || (!state.expandedFlow && isCurrentFlow);
      toggle.className = 'flow-toggle' + (isCurrentFlow ? ' current' : '') + (isExpanded ? ' expanded' : '');
      toggle.textContent = flow.label;
      toggle.addEventListener('click', function () {
        state.activeMenu = 'flow';
        state.expandedConfig = false;
        state.expandedFlow = state.expandedFlow === flow.key ? null : flow.key;
        renderSkills();
        updateSkillMeta();
        syncState();
      });
      appendButtonWithHelp(toggleRow, toggle, helpUrls.flow[flow.key], '查看' + flow.label + '帮助');
    });

    contextShell.appendChild(toggleRow);

    const expandedFlow = getExpandedFlow();
    if (!expandedFlow) {
      return;
    }

    const panel = document.createElement('div');
    panel.className = 'flow-panel' + (state.selectedFlow === expandedFlow.key ? ' current' : '');

    const header = document.createElement('div');
    header.className = 'flow-panel-header';
    const title = document.createElement('div');
    title.className = 'flow-panel-title';
    title.textContent = expandedFlow.label;
    header.appendChild(title);

    const desc = document.createElement('div');
    desc.className = 'flow-panel-desc';
    desc.textContent = expandedFlow.description || '';
    header.appendChild(desc);
    panel.appendChild(header);

    const row = document.createElement('div');
    row.className = 'flow-step-row';
    (expandedFlow.steps || []).forEach(function (step, index) {
      const button = document.createElement('button');
      const isActive = state.selectedFlow === expandedFlow.key && state.selectedSkill === step.key;
      button.className = 'skill-chip flow-step' + (isActive ? ' active' : '');
      button.innerHTML = '<span class="skill-chip-content"><span>' + String(index + 1) + '. ' + step.label + '</span><span class="agent-badge">' + getAgentLabelForSkill(step.key) + '</span></span>';
      button.addEventListener('click', function () {
        state.activeMenu = 'flow';
        state.confirmedMenu = 'flow';
        state.menuOpen = false;
        state.expandedFlow = expandedFlow.key;
        state.selectedFlow = expandedFlow.key;
        state.selectedSkill = step.key;
        renderSkills();
        updateSkillMeta();
        updateSendButtonLabel();
        syncState();
      });
      appendButtonWithHelp(row, button, helpUrls.step[step.key], '查看' + step.label + '帮助');
    });
    panel.appendChild(row);
    contextShell.appendChild(panel);
  }

  function renderSkillsFallback(reason) {
    if (!skillsContainer) {
      return;
    }

    skillsContainer.innerHTML = '';
    const notice = document.createElement('div');
    notice.className = 'auto-panel-desc';
    notice.textContent = '菜单初始化异常，已切换为兼容模式。';
    if (reason) {
      notice.title = reason;
    }
    skillsContainer.appendChild(notice);

    const row = document.createElement('div');
    row.className = 'config-toggle-row';

    function addQuickAction(label, onClick) {
      const button = document.createElement('button');
      button.className = 'quick-btn';
      button.textContent = label;
      button.addEventListener('click', onClick);
      row.appendChild(button);
    }

    addQuickAction('智能路由', function () {
      state.activeMenu = 'auto';
      state.confirmedMenu = 'auto';
      state.menuOpen = false;
      updateSkillMeta();
      updateSendButtonLabel();
      syncState();
    });

    addQuickAction('迭代启动', function () {
      state.activeMenu = 'flow';
      state.confirmedMenu = 'flow';
      state.menuOpen = false;
      state.selectedFlow = 'delivery';
      state.expandedFlow = 'delivery';
      state.selectedSkill = 'init';
      updateSkillMeta();
      updateSendButtonLabel();
      syncState();
    });

    addQuickAction('执行支持', function () {
      state.activeMenu = 'flow';
      state.confirmedMenu = 'flow';
      state.menuOpen = false;
      state.selectedFlow = 'support';
      state.expandedFlow = 'support';
      state.selectedSkill = 'task-support';
      updateSkillMeta();
      updateSendButtonLabel();
      syncState();
    });

    skillsContainer.appendChild(row);
  }

  function renderSkills() {
    try {
      renderSkillsCore();
      if (!skillsContainer || skillsContainer.querySelectorAll('button').length === 0) {
        throw new Error('No skill buttons were rendered.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      renderSkillsFallback(message);
    }
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
    const effectiveSkill = state.activeMenu === 'flow' ? state.selectedSkill : null;
    const text = String(promptInput.value || '').trim();
    if (!text && !effectiveSkill) {
      appendBubble('ai', '请输入业务诉求，或先选择一个流程环节。');
      return;
    }

    appendBubble('user', text || '[使用所选流程环节直接开始]');

    if (effectiveSkill) {
      const currentFlow = getCurrentFlow();
      const currentStep = getCurrentStep();
      const flowText = currentFlow ? currentFlow.label : '未命名流程';
      const stepText = currentStep ? currentStep.label : effectiveSkill;
      appendBubble('ai', '已提交到' + getAgentLabelForSkill(effectiveSkill) + '，当前流程: ' + flowText + '，当前环节: ' + stepText + '。');
    } else {
      appendBubble('ai', '智能路由分析中，请稍候...');
    }

    vscode.postMessage({ type: 'chatRequest', text: text, skill: effectiveSkill });
    promptInput.value = '';
    state.draftText = '';
    syncState();
  }

  window.addEventListener('message', function (event) {
    const message = event.data || {};
    if (message.type === 'updateState' && message.state) {
      Object.assign(state, message.state);
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

  document.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!state.menuOpen) {
      return;
    }

    if (skillsContainer.contains(target)) {
      return;
    }

    state.menuOpen = false;
    renderSkills();
    syncState();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !state.menuOpen) {
      return;
    }

    state.menuOpen = false;
    renderSkills();
    syncState();
  });

  promptInput.value = state.draftText;
  restoreThread();
  renderSkills();
  updateSkillMeta();
  updateSendButtonLabel();
  setBootStatus('BOOT: ui-ready', 'ok');
})();