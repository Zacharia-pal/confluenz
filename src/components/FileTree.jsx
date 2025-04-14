import React, { useEffect, useState } from 'react'

// Helper function to build the tree
function buildIndexTree(files) {
  const root = {}

  // Loop through files and build the hierarchical structure
  for (const file of files) {
    const parts = file.path.split('/')
    let current = root

    parts.forEach((part, i) => {
      if (!current[part]) {
        current[part] = i === parts.length - 1 ? { __file: file } : {}
      }
      current = current[part]
    })
  }

  return root
}

// Function to render the tree-like structure for files/folders with the "Add Subpage" button
function renderIndexTree(tree, pathPrefix = '', onSelect, onAddSubpage) {
  return Object.entries(tree).map(([name, value]) => {
    if (name === '__file') return null // Skip file-level handling here

    const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name
    const hasIndex = value.__file

    return (
      <li key={fullPath}>
        {hasIndex && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📄 <button onClick={() => onSelect(`${fullPath}/index.md`)}>{name}</button>
            {onAddSubpage && (
              <button onClick={() => onAddSubpage(fullPath)}>➕ Add Subpage</button>
            )}
          </div>
        )}
        {Object.keys(value).some(k => k !== '__file') && (
          <ul>
            {renderIndexTree(value, fullPath, onSelect, onAddSubpage)}
          </ul>
        )}
      </li>
    )
  })
}

export default function FileTree({ token, setSelectedPath, repo, branch, onAddSubpage }) {
  const [fileTree, setFileTree] = useState({})

  // Fetch files from GitHub and build the tree
  useEffect(() => {
    if (!token) return

    fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
      headers: { Authorization: `token ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const markdownFiles = (data.tree || []).filter(
          item => item.type === 'blob' && item.path.endsWith('index.md')
        )

        const tree = buildIndexTree(markdownFiles)
        setFileTree(tree)
      })
      .catch(err => {
        console.error("Failed to fetch file tree:", err)
        setFileTree({})
      })
  }, [token, repo, branch])

  return (
    <div>
      <h3>📘 Wiki Pages</h3>
      <ul>{renderIndexTree(fileTree, '', setSelectedPath, onAddSubpage)}</ul>
    </div>
  )
}
