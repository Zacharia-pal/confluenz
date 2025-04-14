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
  const [fileTree, setFileTree] = useState({})

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

  const handleSave = () => {
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
    }).then(() => {
      // Refresh file tree after creating a new file
      setFileTree(prevTree => ({ ...prevTree }))
    })
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
        setFileTree(prevTree => ({ ...prevTree }))  // Trigger UI update
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
        <h1 style={styles.header}>🧠 Confluenz</h1>
        <input
          type="password"
          placeholder="Enter GitHub Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
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
        <FileTree token={token} setSelectedPath={setSelectedPath} repo={GITHUB_REPO} branch={BRANCH} onAddSubpage={onAddSubpage} />
      </div>

      <div style={styles.mainContent}>
        {selectedPath && (
          <>
            <h2 style={styles.selectedPath}>{selectedPath}</h2>
            <button onClick={() => setEditMode(!editMode)} style={styles.toggleButton}>
              {editMode ? "👁 View" : "✏️ Edit"}
            </button>

            {/* Remove separate "Add Subpage" button, it's now managed by FileTree */}
            {editMode && (
              <textarea
                style={styles.textarea}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            )}

            {editMode ? (
              <button onClick={handleSave} style={styles.saveButton}>💾 Save</button>
            ) : (
              <div
                style={styles.fileContent}
                dangerouslySetInnerHTML={{ __html: marked.parse(fileContent) }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#f4f4f4',
    padding: '20px',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    fontSize: '2rem',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    fontSize: '1rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    padding: '20px',
  },
  selectedPath: {
    fontSize: '1.5rem',
    marginBottom: '20px',
  },
  toggleButton: {
    backgroundColor: '#ccc',
    padding: '5px 10px',
    marginBottom: '20px',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  textarea: {
    width: '100%',
    height: '300px',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '20px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  fileContent: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
}
//