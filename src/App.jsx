// src/App.jsx
import React, { useEffect, useState } from 'react'
import MarkdownView from './components/MarkdownView'
import FileTree from './components/FileTree'
import Editor from './components/Editor'
import Login from './components/Login'

const GITHUB_REPO = 'zacharia-pal/confluenz' // Replace this
const BRANCH = 'main'

function App() {
  const [token, setToken] = useState('')
  const [selectedPath, setSelectedPath] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [mode, setMode] = useState('view') // or 'edit'

  return (
    <div className="app" style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <Login token={token} setToken={setToken} />
        <FileTree token={token} setSelectedPath={setSelectedPath} repo={GITHUB_REPO} branch={BRANCH} />
<hr />
<button onClick={() => {
  const newPath = prompt("Enter new file path (e.g., folder/newpage.md)")
  if (!newPath || !token) return

  fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${newPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Create ${newPath}`,
      content: btoa("# New Page"),
      branch: BRANCH,
    }),
  }).then(() => window.location.reload())
}}>
  ➕ New Page
</button>

        <FileTree token={token} setSelectedPath={setSelectedPath} repo={GITHUB_REPO} branch={BRANCH} />
      </div>

      <div style={{ flex: 1, padding: '1rem' }}>
        {mode === 'view' && (
          <>
            <button onClick={() => setMode('edit')}>Edit</button>
            <MarkdownView token={token} repo={GITHUB_REPO} branch={BRANCH} path={selectedPath} />
          </>
        )}

        {mode === 'edit' && (
          <Editor
            token={token}
            repo={GITHUB_REPO}
            branch={BRANCH}
            path={selectedPath}
            onDone={() => setMode('view')}
          />
        )}

{selectedPath && (
  <button
    style={{ background: 'red', color: 'white', marginLeft: '1rem' }}
    onClick={async () => {
      if (!confirm(`Delete ${selectedPath}?`)) return

      // Get SHA first
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${selectedPath}?ref=${BRANCH}`, {
        headers: { Authorization: `token ${token}` },
      })
      const data = await res.json()

      await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${selectedPath}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Delete ${selectedPath}`,
          sha: data.sha,
          branch: BRANCH,
        }),
      })

      alert(`${selectedPath} deleted`)
      window.location.reload()
    }}
  >
    🗑 Delete
  </button>
)}

      </div>
    </div>
  )
}

export default App
