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
    const containerWidth = Math.max(0, Math.floor(containerRect.width));
    const isFlowMenu = state.activeMenu === 'flow';
    const isConfigMenu = state.activeMenu === 'config';
    const minWidth = isFlowMenu ? 360 : isConfigMenu ? 420 : 260;
    const preferredRatio = isFlowMenu ? 0.9 : isConfigMenu ? 0.92 : 0.72;
    const maxWidth = isFlowMenu ? 760 : isConfigMenu ? 860 : 480;
    const preferredWidth = Math.floor(containerWidth * preferredRatio);
    const width = Math.max(
      Math.min(Math.max(minWidth, preferredWidth), maxWidth, containerWidth),
      Math.min(220, containerWidth)
    );
    let left = anchorRect.left - containerRect.left;
    if (left + width > containerWidth) {
      left = Math.max(0, containerWidth - width);
    }
    if (left < 0) {
      left = 0;
    }

    contextShell.style.width = width + 'px';
    contextShell.style.maxHeight = isConfigMenu ? '320px' : '220px';
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

  function normalizeStreamContent(content, fallbackStatus) {
    const raw = content && typeof content === 'object' ? content : {};
    let thinking = typeof raw.thinking === 'string' ? raw.thinking : '';
    let response = typeof raw.response === 'string' ? raw.response : '';
    const errorText = typeof raw.errorText === 'string' ? raw.errorText : '';

    let extractedThinking = '';
    response = response.replace(/<think>([\s\S]*?)(?:<\/think>|$)/g, function(match, p1) {
      extractedThinking += (extractedThinking ? '\n\n' : '') + p1;
      return '';
    });

    if (extractedThinking) {
      thinking = thinking ? (thinking + '\n\n' + extractedThinking) : extractedThinking;
    }

    return {
      thinking: thinking,
      response: response.replace(/^\s+/, ''),
      errorText: errorText,
      thinkingExpanded: raw.thinkingExpanded === true,
      status: raw.status === 'failed' ? 'failed' : raw.status === 'completed' ? 'completed' : (fallbackStatus || 'streaming')
    };
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeHtmlAttribute(value) {
    return escapeHtml(value).replace(/\x60/g, '&#96;');
  }

  function splitTableRow(line) {
    const trimmed = String(line || '').trim();
    const normalized = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
    const withoutTrailing = normalized.endsWith('|') ? normalized.slice(0, -1) : normalized;
    return withoutTrailing.split('|').map(function (cell) { return cell.trim(); });
  }

  function isTableDividerRow(line) {
    const cells = splitTableRow(line);
    if (cells.length === 0) {
      return false;
    }
    return cells.every(function (cell) { return /^:?-{3,}:?$/.test(cell); });
  }

  function renderTable(lines) {
    if (!Array.isArray(lines) || lines.length < 2) {
      return '';
    }

    const headerCells = splitTableRow(lines[0]);
    const bodyRows = lines.slice(2).map(function (line) { return splitTableRow(line); });
    if (headerCells.length === 0) {
      return '';
    }

    const headerHtml = '<thead><tr>' + headerCells.map(function (cell) { return '<th>' + renderInlineMarkdown(cell) + '</th>'; }).join('') + '</tr></thead>';
    const bodyHtml = bodyRows.length > 0
      ? '<tbody>' + bodyRows.map(function (row) {
        return '<tr>' + headerCells.map(function (_, index) {
          return '<td>' + renderInlineMarkdown(row[index] || '') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>'
      : '';

    return '<table>' + headerHtml + bodyHtml + '</table>';
  }

  function parseListItem(rawText) {
    const taskMatch = String(rawText || '').match(/^\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === 'x';
      return {
        isTask: true,
        checked: checked,
        html: '<span class="task-list-item' + (checked ? ' checked' : '') + '"><span class="task-checkbox">' + (checked ? '&#10003;' : '') + '</span><span class="task-text">' + renderInlineMarkdown(taskMatch[2]) + '</span></span>'
      };
    }

    return {
      isTask: false,
      checked: false,
      html: renderInlineMarkdown(rawText)
    };
  }

  function renderInlineMarkdown(text) {
    const source = String(text || '');
    const codeSegments = [];
    const mediaSegments = [];
    let html = escapeHtml(source).replace(/\x60([^\x60]+)\x60/g, function (_, code) {
      const token = '__CODE_' + codeSegments.length + '__';
      codeSegments.push('<code>' + escapeHtml(code) + '</code>');
      return token;
    });

    html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, function (_, alt, url) {
      const safeUrl = escapeHtmlAttribute(url);
      const token = '__MEDIA_' + mediaSegments.length + '__';
      mediaSegments.push('<img src="' + safeUrl + '" alt="' + escapeHtmlAttribute(alt) + '" loading="lazy">');
      return token;
    });
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, url) {
      const safeUrl = escapeHtmlAttribute(url);
      const token = '__MEDIA_' + mediaSegments.length + '__';
      mediaSegments.push('<a href="' + safeUrl + '" target="_blank" rel="noreferrer noopener">' + label + '</a>');
      return token;
    });
    html = html.replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, function (_, prefix, url) {
      const safeUrl = escapeHtmlAttribute(url);
      return prefix + '<a href="' + safeUrl + '" target="_blank" rel="noreferrer noopener">' + safeUrl + '</a>';
    });
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');

    codeSegments.forEach(function (segment, index) {
      html = html.replace('__CODE_' + index + '__', segment);
    });
    mediaSegments.forEach(function (segment, index) {
      html = html.replace('__MEDIA_' + index + '__', segment);
    });

    return html;
  }

  function renderMarkdownBlocks(markdown) {
    const normalized = String(markdown || '').replace(/\r\n?/g, '\n');
    const lines = normalized.split('\n');
    const html = [];
    let paragraphLines = [];
    let listType = null;
    let listItems = [];
    let tableLines = [];
    let skipTableDividerLine = false;

    function flushParagraph() {
      if (paragraphLines.length === 0) {
        return;
      }
      html.push('<p>' + paragraphLines.map(function (line) { return renderInlineMarkdown(line); }).join('<br>') + '</p>');
      paragraphLines = [];
    }

    function flushList() {
      if (!listType || listItems.length === 0) {
        listType = null;
        listItems = [];
        return;
      }
      const hasTaskItems = listItems.some(function (item) { return item.isTask; });
      const listClass = hasTaskItems ? ' class="task-list"' : '';
      html.push('<' + listType + listClass + '>' + listItems.map(function (item) { return '<li>' + item.html + '</li>'; }).join('') + '</' + listType + '>');
      listType = null;
      listItems = [];
    }

    function flushTable() {
      if (tableLines.length < 2) {
        tableLines = [];
        return;
      }
      html.push(renderTable(tableLines));
      tableLines = [];
    }

    lines.forEach(function (line, index) {
      if (skipTableDividerLine) {
        skipTableDividerLine = false;
        return;
      }

      const trimmed = line.trim();
      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
      const unordered = line.match(/^\s*[-*+]\s+(.*)$/);
      const quote = line.match(/^>\s?(.*)$/);
      const hr = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
      const looksLikeTableRow = line.includes('|');
      const nextLine = index + 1 < lines.length ? lines[index + 1] : '';
      const startsTable = looksLikeTableRow && isTableDividerRow(nextLine);

      if (!trimmed) {
        flushParagraph();
        flushList();
        flushTable();
        return;
      }

      if (startsTable) {
        flushParagraph();
        flushList();
        flushTable();
        tableLines = [line, nextLine];
        skipTableDividerLine = true;
        return;
      }

      if (tableLines.length > 0) {
        if (looksLikeTableRow) {
          tableLines.push(line);
          return;
        }
        flushTable();
      }

      if (hr) {
        flushParagraph();
        flushList();
        flushTable();
        html.push('<hr>');
        return;
      }

      if (heading) {
        flushParagraph();
        flushList();
        flushTable();
        const level = Math.min(6, heading[1].length);
        html.push('<h' + level + '>' + renderInlineMarkdown(heading[2]) + '</h' + level + '>');
        return;
      }

      if (quote) {
        flushParagraph();
        flushList();
        flushTable();
        html.push('<blockquote>' + renderInlineMarkdown(quote[1]) + '</blockquote>');
        return;
      }

      if (ordered) {
        flushParagraph();
        flushTable();
        if (listType && listType !== 'ol') {
          flushList();
        }
        listType = 'ol';
        listItems.push(parseListItem(ordered[1]));
        return;
      }

      if (unordered) {
        flushParagraph();
        flushTable();
        if (listType && listType !== 'ul') {
          flushList();
        }
        listType = 'ul';
        listItems.push(parseListItem(unordered[1]));
        return;
      }

      flushList();
      flushTable();
      paragraphLines.push(trimmed);
    });

    flushParagraph();
    flushList();
    flushTable();
    return html.join('');
  }

  function renderMarkdown(text) {
    const normalized = String(text || '').replace(/\r\n?/g, '\n');
    const fencePattern = new RegExp('\\x60\\x60\\x60([^\\n\\x60]*)\\n([\\s\\S]*?)\\x60\\x60\\x60', 'g');
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = fencePattern.exec(normalized)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ kind: 'markdown', text: normalized.slice(lastIndex, match.index) });
      }
      parts.push({ kind: 'code', language: String(match[1] || '').trim(), text: String(match[2] || '') });
      lastIndex = fencePattern.lastIndex;
    }

    if (lastIndex < normalized.length) {
      parts.push({ kind: 'markdown', text: normalized.slice(lastIndex) });
    }

    if (parts.length === 0) {
      parts.push({ kind: 'markdown', text: normalized });
    }

    return parts.map(function (part) {
      if (part.kind === 'code') {
        const languageClass = part.language ? ' class="language-' + escapeHtmlAttribute(part.language) + '"' : '';
        return '<pre><code' + languageClass + '>' + escapeHtml(part.text) + '</code></pre>';
      }
      return renderMarkdownBlocks(part.text);
    }).join('');
  }

  function setBubbleContent(bubble, role, text) {
    if (role === 'ai') {
      try {
        const strText = String(text || '');
        if (strText.includes('<think>')) {
          const normalized = normalizeStreamContent({ response: strText }, 'completed');
          const sections = [];
          if (normalized.thinking.trim().length > 0) {
            sections.push(renderStreamSectionHtml('thinking', 'Thinking', normalized.thinking, { collapsible: true, expanded: false }));
          }
          if (normalized.response.trim().length > 0) {
            sections.push('<div class="ai-response-content">' + renderMarkdown(normalized.response) + '</div>');
          }
          bubble.innerHTML = sections.join('');
        } else {
          bubble.innerHTML = renderMarkdown(strText);
        }
      } catch (error) {
        bubble.textContent = String(text || '');
      }
      return;
    }
    bubble.textContent = String(text || '');
  }

  function createBubbleNode(role, text) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + role;
    setBubbleContent(bubble, role, text);
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

  function appendExtractedTasks(message, skipPersist) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble ai';
    let persistedEntry = skipPersist && message && message.kind === 'extractedTasks' && Array.isArray(message.tasks)
      ? message
      : null;

    const card = document.createElement('div');
    card.className = 'confirm-card';
    const title = document.createElement('div');
    title.textContent = '已提取以下任务，请勾选需要执行的任务：';
    card.appendChild(title);

    const hint = document.createElement('div');
    hint.textContent = '提示：仅 Active 状态任务可勾选，其他状态仅展示不可选择。';
    hint.style.marginTop = '6px';
    hint.style.fontSize = '12px';
    hint.style.color = 'var(--vscode-descriptionForeground)';
    card.appendChild(hint);

    const tasks = Array.isArray(message.tasks) ? message.tasks : [];
    const internalTasks = tasks.map(function(t) { return {...t, currentChecked: t.checked === true}; });

    const tableWrap = document.createElement('div');
    tableWrap.style.overflowX = 'auto';
    tableWrap.style.marginTop = '8px';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';

    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['选择', 'Name', 'Problem', 'ProblemNotes', 'ResolverNotes', 'ProblemType', 'Status', 'Object_ID'].forEach(function (label) {
      const th = document.createElement('th');
      th.textContent = label;
      th.style.textAlign = 'left';
      th.style.padding = '6px 8px';
      th.style.border = '1px solid var(--vscode-panel-border)';
      th.style.background = 'color-mix(in srgb, var(--vscode-editor-background) 84%, var(--vscode-focusBorder))';
      th.style.whiteSpace = 'nowrap';
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);

    const body = document.createElement('tbody');

    function createTextCell(text) {
      const td = document.createElement('td');
      td.textContent = String(text || '');
      td.style.padding = '6px 8px';
      td.style.border = '1px solid var(--vscode-panel-border)';
      td.style.verticalAlign = 'top';
      td.style.whiteSpace = 'pre-wrap';
      td.style.wordBreak = 'break-word';
      return td;
    }

    function isTaskSelectable(status) {
      const normalizedStatus = String(status || '').trim().toLowerCase();
      return normalizedStatus === 'active' || normalizedStatus === 'activity';
    }

    internalTasks.forEach(function(t) {
      const row = document.createElement('tr');
      const selectable = isTaskSelectable(t.status);
      if (!selectable) {
        t.currentChecked = false;
      }

      const selectCell = document.createElement('td');
      selectCell.style.padding = '6px 8px';
      selectCell.style.border = '1px solid var(--vscode-panel-border)';
      selectCell.style.verticalAlign = 'top';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = t.currentChecked;
      cb.disabled = !selectable;
      if (!selectable) {
        cb.title = '仅 Active 状态任务可勾选';
        row.style.opacity = '0.55';
      }
      cb.addEventListener('change', function(e) {
        t.currentChecked = e.target.checked;
        if (persistedEntry && Array.isArray(persistedEntry.tasks)) {
          const stTask = persistedEntry.tasks.find(function(it) { return it.id === t.id; });
          if (stTask) {
            stTask.checked = t.currentChecked;
            syncState();
          }
        }
      });
      selectCell.appendChild(cb);
      row.appendChild(selectCell);

      row.appendChild(createTextCell(t.name));
      row.appendChild(createTextCell(t.problem));
      row.appendChild(createTextCell(t.problemNotes));
      row.appendChild(createTextCell(t.resolverNotes));
      row.appendChild(createTextCell(t.problemType));
      const statusCell = createTextCell(t.status);
      if (!selectable) {
        statusCell.title = '当前任务状态不是 Active，不能勾选';
      }
      row.appendChild(statusCell);
      row.appendChild(createTextCell(t.objectId));

      body.appendChild(row);
    });

    table.appendChild(body);
    tableWrap.appendChild(table);
    card.appendChild(tableWrap);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-btn';
    confirmBtn.style.marginTop = '12px';
    confirmBtn.textContent = '确认生成任务文件';
    confirmBtn.addEventListener('click', function() {
        const finalTasks = internalTasks.map(function(t) { 
            return Object.assign({}, t, { checked: t.currentChecked }); 
        });
        vscode.postMessage({
            type: 'submitExtractedTasks',
            tasks: finalTasks
        });
        confirmBtn.disabled = true;
        confirmBtn.textContent = '已提交...';
    });

    card.appendChild(confirmBtn);
    bubble.appendChild(card);
    thread.appendChild(bubble);
    scrollThreadToBottom();
    
    if (!skipPersist) {
      persistedEntry = {
            kind: 'extractedTasks',
            tasks: internalTasks.map(function(t) { return Object.assign({}, t, { checked: t.currentChecked }); })
      };
      state.thread.push(persistedEntry);
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
      desc.textContent = '集中处理 EA 模板、项目 Copilot/OpenCode 配置初始化与导出参数配置。';
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

      const aiCodingAgentConfigBtn = document.createElement('button');
      aiCodingAgentConfigBtn.className = 'quick-btn';
      aiCodingAgentConfigBtn.textContent = '初始化AICodingAgent配置';
      aiCodingAgentConfigBtn.addEventListener('click', function () {
        state.menuOpen = false;
        appendBubble('user', '[初始化 AICodingAgent 配置]');
        vscode.postMessage({ type: 'statusAction', key: 'initAICodingAgentProjectConfig' });
        renderSkills();
        syncState();
      });
      appendButtonWithHelp(actions, aiCodingAgentConfigBtn, helpUrls.config.opencodeProject, '查看 AICodingAgent 配置初始化帮助');

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
        if (step.key === 'extract-tasks') {
          setTimeout(sendRequest, 100);
        }
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

    let existingEntry = null;
    for (let i = 0; i < state.thread.length; i++) {
        if (state.thread[i].kind === 'streamBubble' && state.thread[i].streamId === streamId) {
            existingEntry = state.thread[i];
            break;
        }
    }

    const bubble = createBubbleNode('ai', '');
    bubble.classList.add('streaming');
    bubble.dataset.streamId = streamId;
    thread.appendChild(bubble);

    const safeContent = existingEntry ? existingEntry.stream : normalizeStreamContent(undefined, 'streaming');

    entry = {
      bubble: bubble,
      label: String(label || (existingEntry ? existingEntry.stream.label : 'OpenCode')),
      content: safeContent
    };

    activeStreams.set(streamId, entry);

    if (!existingEntry) {
      existingEntry = {
        kind: 'streamBubble',
        streamId: streamId,
        stream: entry.content
      };
      state.thread.push(existingEntry);
      syncState();
    }

    setStreamBubbleContent(bubble, entry.label, entry.content);
    scrollThreadToBottom();
    return entry;
  }

  function renderStreamSectionHtml(kind, title, markdown, options) {
    const sectionBody = '<div>' + renderMarkdown(markdown) + '</div>';
    if (options && options.collapsible) {
      const isExpanded = options.expanded === true;
      return '<section class="stream-section ' + kind + '">'
        + '<details class="stream-thinking-details"' + (isExpanded ? ' open' : '') + '>'
        + '<summary class="stream-thinking-summary"><span class="stream-section-title">' + escapeHtml(title) + '</span></summary>'
        + '<div class="stream-thinking-body">' + sectionBody + '</div>'
        + '</details>'
        + '</section>';
    }

    return '<section class="stream-section ' + kind + '">'
      + '<div class="stream-section-title">' + escapeHtml(title) + '</div>'
      + sectionBody
      + '</section>';
  }

  function getStreamStatusLabel(status, content) {
    if (status === 'failed') {
      return '失败';
    }
    if (status === 'completed') {
      return '已完成';
    }
    if (content.response.trim().length > 0) {
      return '回答中';
    }
    return '思考中';
  }

  function renderStreamBubbleHtml(label, content) {
    const normalized = normalizeStreamContent(content, 'streaming');
    const sections = [];
    const thinkingExpanded = normalized.thinkingExpanded === true;

    if (normalized.thinking.trim().length > 0) {
      sections.push(renderStreamSectionHtml('thinking', 'Thinking', normalized.thinking, { collapsible: true, expanded: thinkingExpanded }));
    }
    if (normalized.response.trim().length > 0) {
      sections.push(renderStreamSectionHtml('response', 'Response', normalized.response));
    }
    if (normalized.errorText.trim().length > 0 && normalized.status === 'failed') {
      sections.push(renderStreamSectionHtml('error', 'Error', normalized.errorText));
    }
    if (sections.length === 0) {
      sections.push('<div class="stream-empty">OpenCode 正在准备内容...</div>');
    }

    const statusLabel = getStreamStatusLabel(normalized.status, normalized);
    const statusClass = normalized.status === 'failed' ? 'failed' : normalized.status === 'completed' ? 'completed' : 'thinking';
    return '<div class="stream-shell">'
      + '<div class="stream-header"><div class="stream-title">' + escapeHtml(label || 'OpenCode') + '</div><div class="stream-status ' + statusClass + '">' + escapeHtml(statusLabel) + '</div></div>'
      + sections.join('')
      + '</div>';
  }

  function setStreamBubbleContent(bubble, label, content) {
    try {
      const currentDetails = bubble.querySelector('.stream-thinking-details');
      if (currentDetails instanceof HTMLDetailsElement) {
        bubble.dataset.thinkingExpanded = currentDetails.open ? 'true' : 'false';
      }

      const normalized = normalizeStreamContent(content, 'streaming');
      normalized.thinkingExpanded = bubble.dataset.thinkingExpanded === 'true';
      bubble.innerHTML = renderStreamBubbleHtml(label, normalized);
    } catch (error) {
      const normalized = normalizeStreamContent(content, 'streaming');
      const fallbackText = [normalized.response, normalized.thinking, normalized.errorText]
        .filter(function (item) { return item && item.trim().length > 0; })
        .join('\n\n');
      bubble.textContent = fallbackText || String(label || 'OpenCode');
    }
  }

  function updateStreamBubble(streamId, label, content) {
    const entry = ensureStreamBubble(streamId, label);
    entry.label = String(label || entry.label || 'OpenCode');
    const normalized = normalizeStreamContent(content, 'streaming');
    Object.assign(entry.content, normalized);
    setStreamBubbleContent(entry.bubble, entry.label, entry.content);
    syncState();
    scrollThreadToBottom();
  }

  function finishStreamBubble(streamId, label, content, status) {
    const entry = ensureStreamBubble(streamId, label);
    entry.label = String(label || entry.label || 'OpenCode');
    const normalized = normalizeStreamContent(content, status);
    Object.assign(entry.content, normalized);
    entry.bubble.classList.remove('streaming');
    if (status === 'failed') {
      entry.bubble.classList.add('failed');
    }

    setStreamBubbleContent(entry.bubble, entry.label, entry.content);
    activeStreams.delete(streamId);
    syncState();
    scrollThreadToBottom();
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
        const bubble = createBubbleNode('ai', '');
        setStreamBubbleContent(bubble, item.stream.label, item.stream);
        
        if (item.stream.status === 'failed') {
          bubble.classList.add('failed');
        } else if (item.stream.status === 'streaming') {
          bubble.classList.add('streaming');
          bubble.dataset.streamId = item.streamId || '';
          if (item.streamId) {
            activeStreams.set(item.streamId, {
              bubble: bubble,
              label: item.stream.label,
              content: item.stream
            });
          }
        }
        
        thread.appendChild(bubble);
        return;
      }

      if (item.kind === 'autoSuggestion') {
        appendAutoSuggestion(item, true);
        return;
      }

      if (item.kind === 'extractedTasks') {
        appendExtractedTasks(item, true);
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
    if (message.type === 'extractTasksResult') {
      appendExtractedTasks(message);
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