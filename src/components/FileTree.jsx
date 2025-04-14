import React, { useEffect, useState } from 'react'

// Build a tree only from index.md files
function buildIndexTree(files) {
  const root = {}

  for (const file of files) {
    if (!file.path.endsWith('index.md')) continue

    const parts = file.path.split('/')
    const folderPath = parts.slice(0, -1) // remove index.md
    let current = root

    folderPath.forEach((part) => {
      if (!current[part]) current[part] = {}
      current = current[part]
    })

    // Attach the index.md file at the folder level
    current.__file = file
  }

  return root
}

// Function to render the tree with "Add Subpage" functionality
function renderIndexTree(tree, pathPrefix = '', onSelect, onAddSubpage) {
  return Object.entries(tree).map(([name, value]) => {
    if (name === '__file') return null // handled below

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
  const fetchTree = () => {
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
  }

  useEffect(() => {
    fetchTree()
  }, [token, repo, branch])

  const wrappedAddSubpage = onAddSubpage
    ? async (parentPath) => {
        await onAddSubpage(parentPath) // Call the onAddSubpage callback
        fetchTree() // refresh after creation
      }
    : null

  return (
    <div>
      <h3>📘 Wiki Pages</h3>
      <ul>{renderIndexTree(fileTree, '', setSelectedPath, wrappedAddSubpage)}</ul>
    </div>
  )
}
