export async function callGemini(request) {
  const { apiKey, model, system, messages, temperature = 0.4, maxTokens = 512 } = request;
  
  console.log('🔍 Gemini API call debug:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'none',
    model: model || 'gemini-1.5-pro',
    messageCount: messages?.length || 0,
    messages: messages?.map(m => ({ role: m.role, contentLength: m.content?.length || 0 })),
    system: system?.substring(0, 50) + '...' || 'none'
  });
  
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Add it in the options page.');
  }
  
  // Use a reliable model name - the experimental models might not be available
  const modelName = model === 'gemini-2.0-flash-exp' ? 'gemini-1.5-flash' : (model || 'gemini-1.5-flash');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${apiKey}`;
  
  // Validate and clean messages
  const validMessages = messages.filter(msg => msg && msg.content && msg.content.trim());
  if (validMessages.length === 0) {
    throw new Error('No valid messages provided to Gemini');
  }
  
  const body = {
    contents: validMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content.trim() }]
    })),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };
  
  // Add system instruction only if provided and not empty
  if (system && system.trim()) {
    body.systemInstruction = {
      parts: [{ text: system }]
    };
  }

  console.log('📤 Gemini request:', {
    url: url.replace(/key=.*/g, 'key=***'),
    body: JSON.stringify(body, null, 2)
  });

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Gemini API request timed out after 30 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  console.log('📥 Gemini response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Gemini API error:', error);
    throw new Error(`Gemini error (${response.status}): ${error}`);
  }

  const data = await response.json();
  console.log('📦 Gemini response data:', JSON.stringify(data, null, 2));
  
  // Check for safety issues or blocks
  if (data.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new Error('Gemini blocked response due to safety concerns. Try rephrasing your request.');
  }
  
  if (data.candidates?.[0]?.finishReason === 'RECITATION') {
    throw new Error('Gemini blocked response due to recitation concerns.');
  }
  
  const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!output) {
    console.error('❌ Empty response structure:', {
      candidates: data.candidates,
      candidateCount: data.candidates?.length || 0,
      firstCandidate: data.candidates?.[0],
      finishReason: data.candidates?.[0]?.finishReason,
      content: data.candidates?.[0]?.content,
      parts: data.candidates?.[0]?.content?.parts,
      promptFeedback: data.promptFeedback
    });
    
    // Provide more specific error messages
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned no candidates. The request might have been blocked.');
    }
    
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}`);
    }
    
    throw new Error('Empty response from Gemini - the content might have been filtered');
  }
  
  console.log('✅ Gemini success:', { textLength: output.length });
  return {
    text: output,
    raw: data
  };
}
