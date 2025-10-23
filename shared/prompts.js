export const PROMPTS = {
  rewrite: {
    id: 'rewrite',
    label: 'Rewrite',
    template: 'Task: Rewrite the selection for clarity and readability without changing meaning. Selection: """{selection}""" Return only the revised text.'
  },
  grammar: {
    id: 'grammar',
    label: 'Fix Grammar',
    template: 'Task: Fix grammar, spelling, and punctuation while preserving style. Selection: """{selection}""" Return only corrected text.'
  },
  shorten: {
    id: 'shorten',
    label: 'Shorten',
    template: 'Task: Shorten the selection while keeping key meaning and voice. Target: {target} words. Selection: """{selection}""" Return only the rewritten text.'
  },
  expand: {
    id: 'expand',
    label: 'Expand',
    template: 'Task: Expand the selection with helpful detail while preserving meaning. Selection: """{selection}""" Return only the expanded text.'
  },
  tone: {
    id: 'tone',
    label: 'Adjust Tone',
    template: 'Task: Rephrase the selection with tone="{tone}". Selection: """{selection}""" Keep facts accurate.'
  },
  translate: {
    id: 'translate',
    label: 'Translate',
    template: 'Task: Translate the selection to {language}. Selection: """{selection}""" Preserve names and numbers.'
  },
  dictation: {
    id: 'dictation',
    label: 'Clean Dictation',
    template: 'Task: Clean up informal dictation into full sentences; remove fillers; keep intent. Text: """{transcript}""" Return cleaned version only.'
  },
  chat: {
    id: 'chat',
    label: 'Chat',
    template: 'You are a concise, high-precision writing assistant. Default to preserving meaning and facts. Never invent citations.'
  }
};
