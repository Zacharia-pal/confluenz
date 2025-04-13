import React, { useState, useEffect } from 'react'
import FileTree from './components/FileTree'

const GITHUB_REPO = "zacharia-pal/confluenz"
const BRANCH = "main"

export default function App() {
  const [token, setToken] = useState("")
  const [selectedPath, setSelectedPath] = useState(null)
  const [fileContent, setFileContent] = useState("")
  const [editMode, setEditMode] = useState(false)

  // Fetch file content based on selected file path
  useEffect(() => {
    if (!selectedPath || !token) return

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${selectedPath}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const content = atob(data.content) // Decode the content from base64
        setFileContent(content)
        setEditMode(false) // Set the default mode to view (non-editing)
      })
  }, [selectedPath, token])

  // Save the file when editing is done
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
            content: btoa(fileContent), // Encode content back to base64
            sha: data.sha,
            branch: BRANCH,
          }),
        }).then(() => alert("Saved!"))
      })
  }

  // Create a new file on GitHub
  const createFile = (path, defaultContent = "# New Page") => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Create ${path}`,
        content: btoa(defaultContent), // Encode content as base64
        branch: BRANCH,
      }),
    }).then(() => window.location.reload()) // Reload after creating the file
  }

  // Create a folder with a placeholder file
  const createFolder = (folderPath) => {
    const placeholderFile = `${folderPath.replace(/\/$/, '')}/.gitkeep`
    createFile(placeholderFile, "placeholder")
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      <div>
        <h1>🧠 Confluenz</h1>
        <input
          type="password"
          placeholder="Enter GitHub Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <br /><br />

        {/* Button to create a new markdown file */}
        <button onClick={() => {
          const newPath = prompt("Enter new file path (e.g., folder/newfile.md)")
          if (!newPath || !token) return
          createFile(newPath)
        }}>
          ➕ New Page
        </button>

        <br /><br />

        {/* Button to create a new folder */}
        <button onClick={() => {
          const folderPath = prompt("Enter new folder path (e.g., docs/myfolder)")
          if (!folderPath || !token) return
          createFolder(folderPath)
        }}>
          📁 New Folder
        </button>

        <br /><br />

        {/* Render File Tree */}
        <FileTree token={token} setSelectedPath={setSelectedPath} repo={GITHUB_REPO} branch={BRANCH} />
      </div>

      <div style={{ flex: 1 }}>
        {selectedPath && (
          <>
            <h2>{selectedPath}</h2>
            <button onClick={() => setEditMode(!editMode)}>
              {editMode ? "👁 View" : "✏️ Edit"}
            </button>
            <br /><br />

            {/* Button to add a subpage */}
            <button onClick={() => {
              const subName = prompt("Subpage name (e.g. notes.md)")
              if (!subName || !selectedPath || !token) return

              const parentDir = selectedPath.endsWith('/')
                ? selectedPath
                : selectedPath + '/'

              const newSubPath = `${parentDir}${subName}`
              createFile(newSubPath)
            }}>
              ➕ Add Subpage
            </button>
            <br /><br />

            {/* Display the markdown file content */}
            {editMode ? (
              <textarea
                style={{ width: '100%', height: '400px' }}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '400px',
                  padding: '1rem',
                  backgroundColor: '#f9f9f9',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #ccc',
                  overflowY: 'auto',
                }}
              >
                {fileContent}
              </div>
            )}

            {editMode && (
              <>
                <br />
                <button onClick={handleSave}>💾 Save</button>
              </>
            )}

            {/* Delete Button */}
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
