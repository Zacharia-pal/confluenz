import React, { useEffect, useState } from 'react'

export default function Editor({ token, repo, branch, path, onDone }) {
  const [content, setContent] = useState('')
  const [sha, setSha] = useState(null)

  useEffect(() => {
    if (!path) return

    fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        Authorization: `token ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const decoded = atob(data.content)
        setContent(decoded)
        setSha(data.sha)
      })
  }, [path])

  const handleSave = () => {
    fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update ${path}`,
        content: btoa(content),
        sha: sha,
        branch: branch,
      }),
    }).then(() => onDone())
  }

  return (
    <div>
      <h3>✍️ Editing: {path}</h3>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows="20"
        style={{ width: '100%' }}
      />
      <br />
      <button onClick={handleSave}>💾 Save</button>
      <button onClick={onDone}>❌ Cancel</button>
    </div>
  )
}
