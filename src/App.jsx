import React, { useState, useEffect } from 'react'
import FileTree from './components/FileTree'
import { marked } from 'marked'

const GITHUB_REPO = "zacharia-pal/confluenz"
const BRANCH = "main"

export default function App() {
  const [token, setToken] = useState("")
  const [selectedPath, setSelectedPath] = useState(null)
  const [fileContent, setFileContent] = useState("")
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!selectedPath || !token) return

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${selectedPath}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const content = atob(data.content)
        setFileContent(content)
        setEditMode(false) // default to view mode when switching files
      })
  }, [selectedPath, token])

  function handleSave() {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${selectedPath}`, {
      method: 'GET',
      headers: { Authorization: `token ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${selectedPath}`, {
          method: 'PUT',
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Update ${selectedPath}`,
            content: btoa(fileContent),
            sha: data.sha,
            branch: BRANCH,
          }),
        }).then(() => alert("Saved!"))
      })
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      <div>
        <h1>Confluenz</h1>
        <input
          type="password"
          placeholder="Enter GitHub Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <br /><br />

        <button onClick={() => {
          const newPath = prompt("Enter new file path (e.g., folder/newfile.md)")
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

        <br /><br />
        <FileTree token={token} setSelectedPath={setSelectedPath} repo={GITHUB_REPO} branch={BRANCH} />
      </div>

      <div style={{ flex: 1 }}>
        {selectedPath && (
          <>
            <h2>{selectedPath}</h2>

            {/* 🔁 View/Edit Toggle */}
            <button onClick={() => setEditMode(!editMode)}>
              {editMode ? "👁 View Mode" : "✏️ Edit Mode"}
            </button>

            <br /><br />

            {editMode ? (
              <textarea
                style={{ width: '100%', height: '400px' }}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            ) : (
              <div
                style={{ border: '1px solid #ccc', padding: '1rem' }}
                dangerouslySetInnerHTML={{ __html: marked.parse(fileContent) }}
              />
            )}

            <br />
            {editMode && <button onClick={handleSave}>💾 Save</button>}
            <button
              style={{ marginLeft: '1rem', backgroundColor: 'red', color: 'white' }}
              onClick={async () => {
                if (!confirm(`Are you sure you want to delete ${selectedPath}?`)) return

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

                alert("File deleted.")
                setSelectedPath(null)
                setFileContent("")
              }}
            >
              🗑 Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}
