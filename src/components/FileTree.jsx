import React, { useEffect, useState } from 'react'

// Function to build a tree-like structure for files/folders
function buildTree(files) {
  const root = {}

  // Loop through files and build the hierarchical structure
  for (const file of files) {
    const parts = file.path.split('/')
    let current = root

    parts.forEach((part, i) => {
      // If we are at the last part, it's a file, otherwise a folder
      if (!current[part]) {
        current[part] = i === parts.length - 1 ? { __file: file } : {}
      }
      current = current[part]
    })
  }

  return root
}

// Function to render the file/folder structure recursively
function renderTree(tree, pathPrefix = '', onSelect) {
  return Object.entries(tree).map(([name, value]) => {
    const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name

    // Check if it's a file or folder, and render accordingly
    if (value.__file) {
      return (
        <li key={fullPath}>
          {/* Hide the .md extension and display it */}
          📄 <button onClick={() => onSelect(fullPath)}>{name.replace('.md', '')}</button>
        </li>
      )
    } else {
      return (
        <li key={fullPath}>
          {/* Folder, toggle visibility */}
          📁 <details>
            <summary>{name}</summary>
            <ul>{renderTree(value, fullPath, onSelect)}</ul>
          </details>
        </li>
      )
    }
  })
}

export default function FileTree({ token, setSelectedPath, repo, branch }) {
  const [files, setFiles] = useState([])

  // Fetch files when token is available
  useEffect(() => {
    if (!token) return
    fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
      headers: { Authorization: `token ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        // Filter out files with '.md' extension
        const markdownFiles = data.tree.filter(item => item.type === 'blob' && item.path.endsWith('.md'))
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
