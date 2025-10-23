export async function callOpenAI(request) {
  const { apiKey, model, system, messages, temperature = 0.4, maxTokens = 512 } = request;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Add it in the options page.');
  }
  const body = {
    model: model || 'gpt-4o-mini',
    temperature,
    max_output_tokens: maxTokens,
    input: [
      {
        role: 'system',
        content: [{ type: 'text', text: system }]
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }]
      }))
    ]
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  const output = data.output?.[0]?.content?.[0]?.text;
  if (!output) {
    throw new Error('Empty response from OpenAI');
  }
  return {
    text: output,
    raw: data
  };
}
