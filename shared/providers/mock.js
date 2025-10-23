function simpleRewrite(text) {
  const trimmed = text.trim();
  if (!trimmed) return 'Please provide text to transform.';
  const sentences = trimmed.split(/(?<=[.!?])\s+/);
  return sentences
    .map((sentence) => {
      const words = sentence.split(/\s+/);
      if (words.length < 3) return sentence;
      return words
        .map((word, index) => {
          if (index === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word.toLowerCase();
        })
        .join(' ');
    })
    .join(' ');
}

function shorten(text) {
  return text
    .split(/\s+/)
    .slice(0, 30)
    .join(' ');
}

function expand(text) {
  return `${text}\n\nHere is a concise elaboration: ${text} This adds a bit more detail for clarity.`;
}

function improveWriting(text) {
  const improved = simpleRewrite(text)
    .replace(/\bthat\b/g, 'which')
    .replace(/\bvery\b/g, 'extremely')
    .replace(/\bgood\b/g, 'excellent')
    .replace(/\bbad\b/g, 'poor');
  return `${improved} [✨ Enhanced for clarity and flow]`;
}

function fixGrammar(text) {
  return text
    .replace(/\bits\b/g, "it's")
    .replace(/\bgrammer\b/g, 'grammar')
    .replace(/\bdefinitly\b/g, 'definitely')
    .replace(/\breadibility\b/g, 'readability')
    .replace(/\bstructure is\b/g, 'structure are')
    .replace(/structure are/g, 'structure is') + ' [✓ Grammar fixed]';
}

function summarizeText(text) {
  const words = text.split(/\s+/);
  if (words.length <= 10) return `Summary: ${text}`;
  return `Summary: ${words.slice(0, 10).join(' ')}... [📝 Key points extracted]`;
}

function explainText(text) {
  return `Explanation: This text discusses ${text.toLowerCase().substring(0, 50)}... The main concept involves key ideas that can be understood as [concept explanation]. [💡 Simplified explanation]`;
}

function makeProfessional(text) {
  return text
    .replace(/\bhey there\b/gi, 'Dear colleague')
    .replace(/\bpretty well\b/gi, 'progressing satisfactorily')
    .replace(/\bsoon\b/gi, 'within the projected timeline')
    .replace(/\bwhatever\b/gi, 'any additional concerns')
    .replace(/\bomg\b/gi, 'I must note that')
    .replace(/\bsuper\b/gi, 'extremely')
    .replace(/\band stuff\b/gi, 'and related matters') + ' [👔 Professional tone applied]';
}

export async function callMock(request) {
  const { action, selection, tone = 'neutral', language = 'English', messages = [] } = request;
  
  // Add a small delay to simulate real API call
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Handle instruction-based requests (from our new panel)
  if (messages && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    const instruction = lastMessage.content.toLowerCase();
    
    if (instruction.includes('improve') || instruction.includes('writing') || instruction.includes('clarity')) {
      return { text: improveWriting(selection), raw: null };
    }
    if (instruction.includes('grammar') || instruction.includes('spelling')) {
      return { text: fixGrammar(selection), raw: null };
    }
    if (instruction.includes('summarise') || instruction.includes('summarize') || instruction.includes('summary')) {
      return { text: summarizeText(selection), raw: null };
    }
    if (instruction.includes('explain') || instruction.includes('what is')) {
      return { text: explainText(selection), raw: null };
    }
    if (instruction.includes('professional') || instruction.includes('formal')) {
      return { text: makeProfessional(selection), raw: null };
    }
  }
  
  // Handle action-based requests
  switch (action) {
    case 'improve':
    case 'rewrite':
      return { text: improveWriting(selection), raw: null };
    case 'grammar':
      return { text: fixGrammar(selection), raw: null };
    case 'summarise':
    case 'summarize':
      return { text: summarizeText(selection), raw: null };
    case 'explain':
      return { text: explainText(selection), raw: null };
    case 'professional':
      return { text: makeProfessional(selection), raw: null };
    case 'shorten':
      return { text: shorten(selection), raw: null };
    case 'expand':
      return { text: expand(selection), raw: null };
    case 'tone':
      return { text: `${simpleRewrite(selection)} (tone adjusted to ${tone})`, raw: null };
    case 'translate':
      return { text: `${selection} (translated to ${language})`, raw: null };
    case 'dictation':
      return { text: simpleRewrite(selection), raw: null };
    case 'chat':
    case 'selection':
    case 'chat-followup':
      return { text: `Mock response: I've processed your request about "${selection.substring(0, 30)}..." and here's an improved version: ${improveWriting(selection)}`, raw: null };
    default:
      return { text: `${improveWriting(selection)} [🤖 Mock AI response]`, raw: null };
  }
}
