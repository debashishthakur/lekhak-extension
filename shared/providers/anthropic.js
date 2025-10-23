export async function callAnthropic(request) {
  const { apiKey, model, system, messages, temperature = 0.4, maxTokens = 512 } = request;
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Add it in the options page.');
  }
  const body = {
    model: model || 'claude-3-5-sonnet-20241022',
    max_output_tokens: maxTokens,
    temperature,
    system,
    messages: messages.map((msg) => ({ role: msg.role, content: [{ type: 'text', text: msg.content }] }))
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic error: ${error}`);
  }

  const data = await response.json();
  const output = data.content?.[0]?.text;
  if (!output) {
    throw new Error('Empty response from Anthropic');
  }
  return {
    text: output,
    raw: data
  };
}
