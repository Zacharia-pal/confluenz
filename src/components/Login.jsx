import React from 'react'

export default function Login({ token, setToken }) {
  const handleTokenChange = (e) => setToken(e.target.value)

  return (
    <div>
      <h3>GitHub Token</h3>
      <input
        type="password"
        value={token}
        onChange={handleTokenChange}
        placeholder="Paste GitHub PAT"
        style={{ width: '100%' }}
      />
      <p style={{ fontSize: '0.8em' }}>
        Create one at <a href="https://github.com/settings/tokens" target="_blank">GitHub → Tokens</a>
      </p>
    </div>
  )
}
