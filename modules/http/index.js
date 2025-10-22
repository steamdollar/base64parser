// HTTP 요청 함수
export async function sendHttpRequest(url, method, headers, body) {
  try {
    const requestOptions = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && method.toUpperCase() !== 'GET') {
      requestOptions.body = body;
    }

    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
