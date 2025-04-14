import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

const FileTree = forwardRef(({ token, repo, branch, onAddSubpage }, ref) => {
  const [tree, setTree] = useState([])

  useEffect(() => {
    if (!token) return

    fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
      headers: { Authorization: `token ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.tree) {
          setTree(data.tree.filter(file => !file.path.includes('/.gitkeep')))
        }
      })
      .catch(err => {
        console.error('Error fetching file tree:', err)
      })
  }, [token, repo, branch])

  // Expose a method to refresh the tree
  useImperativeHandle(ref, () => ({
    refreshFileTree: () => {
      console.log("Refreshing file tree...")
      setTree([]) // Clear existing tree
      // Re-fetch the tree after clearing it
      fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
        headers: { Authorization: `token ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.tree) {
            setTree(data.tree.filter(file => !file.path.includes('/.gitkeep')))
          }
        })
        .catch(err => {
          console.error('Error fetching file tree:', err)
        })
    },
  }))

  return (
    <div style={styles.treeContainer}>
      <h2>File Tree</h2>
      <ul>
        {tree.map((file) => (
          <li key={file.path}>
            <span>{file.path}</span>
            {file.type === "tree" && (
              <button onClick={() => onAddSubpage(file.path)} style={styles.addButton}>➕</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
})

export default FileTree

const styles = {
  treeContainer: {
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  addButton: {
    marginLeft: '10px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.2rem 0.5rem',
    cursor: 'pointer',
    borderRadius: '4px',
  }
}
