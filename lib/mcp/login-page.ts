export function loginPage(
  pendingId: string,
  actionUrl: string,
  error?: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authorize - Real Estate Admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0a; color: #fafafa; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 400px; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: .25rem; }
    .subtitle { color: #a3a3a3; font-size: .875rem; margin-bottom: 1.75rem; }
    label { display: block; font-size: .875rem; font-weight: 500; margin-bottom: .375rem; color: #d4d4d4; }
    input { width: 100%; padding: .625rem .75rem; border: 1px solid #404040; border-radius: 8px; background: #0a0a0a; color: #fafafa; font-size: .875rem; margin-bottom: 1rem; outline: none; transition: border-color .15s; }
    input:focus { border-color: #737373; }
    button { width: 100%; padding: .625rem; background: #fafafa; color: #0a0a0a; border: none; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; transition: opacity .15s; }
    button:hover { opacity: .9; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: .75rem; border-radius: 8px; font-size: .8125rem; margin-bottom: 1rem; }
    .info { color: #737373; font-size: .75rem; text-align: center; margin-top: 1.25rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Real Estate Admin</h1>
    <p class="subtitle">Sign in to authorize Claude to manage your real estate website.</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="${actionUrl}">
      <input type="hidden" name="pending_id" value="${pendingId}" />
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required autocomplete="email" autofocus />
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required autocomplete="current-password" />
      <button type="submit">Authorize</button>
    </form>
    <p class="info">This will grant Claude access to your admin tools.</p>
  </div>
</body>
</html>`;
}
