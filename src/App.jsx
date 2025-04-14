import React, { useState, useEffect, useRef } from 'react'
import FileTree from './components/FileTree'
import { marked } from 'marked'

const GITHUB_REPO = "zacharia-pal/confluenz"
const BRANCH = "main"
const currentversion = "1.1.1"

export default function App() {
  const [token, setToken] = useState("")
  const [selectedPath, setSelectedPath] = useState(null)
  const [fileContent, setFileContent] = useState("")
  const [editMode, setEditMode] = useState(false)
  
  // Create a reference to refresh the file tree
  const fileTreeRef = useRef(null);

  useEffect(() => {
    if (!selectedPath || !token) return

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${selectedPath}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        if (!data.content) {
          throw new Error("No content found in response.")
        }
        const content = atob(data.content)
        setFileContent(content)
        setEditMode(false)
      })
      .catch(err => {
        console.error("Failed to load file:", err)
        alert("Failed to load file. Please check your token and path.")
        setFileContent("# Error loading file")
      })
  }, [selectedPath, token])

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

  // onAddSubpage function to create a subpage
  const onAddSubpage = async (parentFolderPath) => {
    const subpageName = prompt("Enter the name for the new subpage folder:", "NewSubPage")
    if (!subpageName) return

    const newSubpagePath = `${parentFolderPath}/${subpageName}/index.md`

    // Content for the new index.md file
    const content = "# New Subpage\n\nThis is a newly created subpage."

    try {
      // Create the new subpage (index.md)
      const createFileResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${newSubpagePath}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          message: `Create new subpage: ${subpageName}`,
          content: btoa(content),  // Base64 encode the content
        }),
      })

      if (createFileResponse.ok) {
        console.log("Subpage created successfully!")
        // Refresh the file tree after subpage creation
        fileTreeRef.current.refreshFileTree();  // Call the refresh method on FileTree
        setSelectedPath(null)  // Clear the selection to trigger a fresh load of the file tree
      } else {
        console.error("Failed to create subpage:", createFileResponse.statusText)
      }
    } catch (error) {
      console.error("Error creating subpage:", error)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h1 style={styles.header}>🧠 Confluenz {currentversion}</h1>
        <input
          type="password"
          placeholder="Enter GitHub Token"
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          style={styles.input}
        />

        <button onClick={() => {
          const name = prompt("Enter page name (e.g. intro)")
          if (!name || !token) return
          createFile(`${name}/index.md`)
        }} style={styles.button}>
          ➕ New Page
        </button>

        <button onClick={() => {
          const folder = prompt("Folder name (e.g. docs/guide)")
          if (!folder || !token) return
          createFolder(folder)
        }} style={styles.button}>
          📁 New Folder
        </button>

        {/* Pass onAddSubpage to FileTree component */}
        <FileTree 
          token={token} 
          setSelectedPath={setSelectedPath} 
          repo={GITHUB_REPO} 
          branch={BRANCH} 
          onAddSubpage={onAddSubpage} 
          ref={fileTreeRef} // Attach the ref here to be used for refreshing
        />
      </div>

      <div style={styles.mainContent}>
        {selectedPath && (
          <>
            <h2 style={styles.selectedPath}>{selectedPath}</h2>
            <button onClick={() => setEditMode(!editMode)} style={styles.toggleButton}>
              {editMode ? "👁 View" : "✏️ Edit"}
            </button>

            <button onClick={async () => {
              const subName = prompt("Subpage name (e.g. overview)")
              if (!subName || !selectedPath || !token) return

              const basePath = selectedPath.replace(/\/index\.md$/, "")
              const newSubPath = `${basePath}/${subName}/index.md`
              const content = "# New Subpage\n\nThis is a newly created subpage."

              try {
                const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${newSubPath}`, {
                  method: 'PUT',
                  headers: {
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: `Create new subpage: ${subName}`,
                    content: btoa(content),
                    branch: BRANCH,
                  }),
                })

                if (res.ok) {
                  alert("Subpage created successfully!")
                  fileTreeRef.current.refreshFileTree(); // Refresh the file tree
                } else {
                  const err = await res.json()
                  alert("Failed to create subpage: " + err.message)
                }
              } catch (error) {
                console.error("Error creating subpage:", error)
                alert("Error creating subpage. Check console.")
              }
            }} style={styles.button}>
              ➕ Add Subpage
            </button>


            {editMode ? (
              <textarea
                style={styles.textarea}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            ) : (
              <div
                style={styles.fileContent}
                dangerouslySetInnerHTML={{ __html: marked.parse(fileContent) }}
              />
            )}

            {editMode && (
              <button onClick={handleSave} style={styles.saveButton}>💾 Save</button>
            )}

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
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'white',
    fontFamily: 'Arial, sans-serif',
  },
  sidebar: {
    flex: '0 0 250px',
    backgroundColor: '#f5f5f5',
    padding: '1rem',
    borderRight: '1px solid #e0e0e0',
    overflowY: 'auto',
  },
  header: {
    color: '#1e3a8a',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  input: {
    padding: '0.5rem',
    width: '90%',
    borderRadius: '6px',
    border: '1px solid #ddd',
    marginBottom: '1rem',
  },
  button: {
    backgroundColor: '#1e3a8a',
    color: 'white',
    padding: '0.5rem',
    width: '100%',
    marginBottom: '0.5rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  selectedPath: {
    fontSize: '18px',
    color: '#1e3a8a',
    marginBottom: '1rem',
  },
  toggleButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  textarea: {
    width: '90%',
    height: '400px',
    padding: '1rem',
    fontFamily: 'monospace',
    fontSize: '16px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    marginBottom: '1rem',
  },
  fileContent: {
    flex: 1,
    width: '100%',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    color: '#1f2937',
    borderRadius: '6px',
    border: '1px solid #ddd',
    lineHeight: 1.6,
    overflowY: 'auto',
  },
  saveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    marginRight: '1rem',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '1rem',
  },
}
  