import React, { useEffect, useState } from 'react'

// Build tree structure from flat file list
function buildTree(files) {
  const root = {}

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

// Recursively render tree nodes
function renderTree(tree, pathPrefix = '', onSelect) {
  return Object.entries(tree).map(([name, value]) => {
    const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name

    // Render markdown files (should only be index.md)
    if (value.__file) {
      const displayName = pathPrefix.split('/').slice(-1)[0] || 'Home'
      return (
        <li key={fullPath}>
          📄 <button onClick={() => onSelect(fullPath)}>{displayName}</button>
        </li>
      )
    }

    // Render folders recursively
    return (
      <li key={fullPath}>
        📁 <details>
          <summary>{name}</summary>
          <ul>{renderTree(value, fullPath, onSelect)}</ul>
        </details>
      </li>
    )
  })
}

export default function FileTree({ token, setSelectedPath, repo, branch }) {
  const [files, setFiles] = useState([])

  useEffect(() => {
    if (!token) return

    fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
      headers: { Authorization: `token ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        // Only keep index.md files to reflect page structure
        const markdownFiles = data.tree.filter(
          item => item.type === 'blob' && item.path.endsWith('/index.md')
        )
        setFiles(markdownFiles)
      })
  }, [token])

  const fileTree = buildTree(files)

  return (
    <div>
      <h3>📘 Wiki Pages</h3>
      <ul>{renderTree(fileTree, '', setSelectedPath)}</ul>
    </div>
  )
}
