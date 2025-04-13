import React, { useState, useEffect } from 'react'
import FileTree from './components/FileTree'

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
        setEditMode(false)
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

  const createFile = (path, defaultContent = "# New Page") => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Create ${path}`,
        content: btoa(defaultContent),
        branch: BRANCH,
      }),
    }).then(() => window.location.reload())
  }

  const createFolder = (folderPath) => {
    const placeholderFile = `${folderPath.replace(/\/$/, '')}/.gitkeep`
    createFile(placeholderFile, "placeholder")
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h1 style={styles.header}>🧠 Confluenz</h1>
        <input
          type="password"
          placeholder="Enter GitHub Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={styles.input}
        />
        <br />

        <button onClick={() => {
          const newPath = prompt("Enter new file path (e.g., folder/newfile.md)")
          if (!newPath || !token) return
          createFile(newPath)
        }} style={styles.button}>
          ➕ New Page
        </button>

        <br />

        <button onClick={() => {
          const folderPath = prompt("Enter new folder path (e.g., docs/myfolder)")
          if (!folderPath || !token) return
          createFolder(folderPath)
        }} style={styles.button}>
          📁 New Folder
        </button>

        <br />

        <FileTree token={token} setSelectedPath={setSelectedPath} repo={GITHUB_REPO} branch={BRANCH} />
      </div>

      <div style={styles.mainContent}>
        {selectedPath && (
          <>
            <h2 style={styles.selectedPath}>{selectedPath}</h2>
            <button onClick={() => setEditMode(!editMode)} style={styles.toggleButton}>
              {editMode ? "👁 View" : "✏️ Edit"}
            </button>
            <br />

            {/* Add Subpage */}
            <button onClick={() => {
              const subName = prompt("Subpage name (e.g. notes.md)")
              if (!subName || !selectedPath || !token) return

              const parentDir = selectedPath.endsWith('/')
                ? selectedPath
                : selectedPath + '/'

              const newSubPath = `${parentDir}${subName}`
              createFile(newSubPath)
            }} style={styles.button}>
              ➕ Add Subpage
            </button>
            <br />

            {/* File Content Display or Edit */}
            {editMode ? (
              <textarea
                style={styles.textarea}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            ) : (
              <div style={styles.fileContent}>
                {fileContent}
              </div>
            )}

            {editMode && (
              <>
                <br />
                <button onClick={handleSave} style={styles.saveButton}>💾 Save</button>
              </>
            )}

            {/* Delete Button */}
            <button
              style={styles.deleteButton}
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh', // Make sure the container fills the full viewport height
    minHeight: '100vh', // Ensures that the layout doesn't shrink below viewport height
    gap: '2rem',
    padding: '1rem',
    backgroundColor: 'white',
    color: '#333',
    fontFamily: 'Arial, sans-serif',
  },
  sidebar: {
    flex: '0 0 250px',
    backgroundColor: '#f5f5f5',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
    height: '100%', // Sidebar fills entire height
    overflowY: 'auto', // Allow scrolling in case of overflow
  },
  header: {
    color: '#1e3a8a',  // Dark blue color
    fontSize: '24px',
    fontWeight: 'bold',
  },
  input: {
    padding: '0.5rem',
    width: '100%',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  button: {
    backgroundColor: '#1e3a8a',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '1rem',
    width: '100%',
    fontSize: '16px',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
    height: '100%', // Content area fills the entire height
    overflowY: 'auto', // Allow scrolling in case of overflow
    maxWidth: '100%',
  },
  selectedPath: {
    color: '#1e3a8a',
    fontSize: '20px',
    marginBottom: '1rem',
  },
  toggleButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  textarea: {
    width: '100%',
    height: '300px',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontFamily: 'monospace',
    fontSize: '16px',
  },
  fileContent: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    whiteSpace: 'pre-wrap',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontFamily: 'monospace',
    fontSize: '16px',
  },
  saveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
}
