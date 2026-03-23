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

console.log(normalizeStreamContent({ response: "<think>\nThinking about life...\n</think>\n\nHere is my text    " }, "streaming"));
console.log(normalizeStreamContent({ response: "Hello\n<think>\nThinking about life...\n</think>\n\nWorld    " }, "streaming"));
console.log(normalizeStreamContent({ thinking: "Pre-existing thought", response: "<think>\nMore thoughts...</th" }, "streaming"));
