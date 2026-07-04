export async function convertCode({ html, css, target }) {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, css, target }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `Conversion failed (${response.status})`);
  }

  return data;
}

export async function healthCheck() {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
