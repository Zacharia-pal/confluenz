import React, { useEffect, useState } from 'react'

function buildTree(files) {
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

// Function to render the tree-like structure for files/folders
function renderTree(tree, pathPrefix = '', onSelect) {
  return Object.entries(tree).map(([name, value]) => {
    const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name

    // Special case: folder with only index.md
    if (value.__file && value.__file.path.endsWith('index.md')) {
      return (
        <li key={fullPath}>
          📄 <button onClick={() => onSelect(fullPath)}>{name.replace('index.md', '') || name}</button>
          {/* Render subpages (index.md inside subfolders) */}
          {value.subpages && (
            <ul>
              {renderTree(value.subpages, fullPath, onSelect)}
            </ul>
          )}
        </li>
      )
    }

    // Folder with more than index.md (or nested subpages)
    if (!value.__file) {
      return (
        <li key={fullPath}>
          📁 <details>
            <summary>{name}</summary>
            <ul>{renderTree(value, fullPath, onSelect)}</ul>
          </details>
        </li>
      )
    }

    // Single file (non-index)
    return (
      <li key={fullPath}>
        📄 <button onClick={() => onSelect(fullPath)}>{name.replace('.md', '')}</button>
      </li>
    )
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

        // Process files into a tree structure
        const fileTree = buildTree(markdownFiles)

        // Recursively add subpages (index.md files inside folders)
        function addSubpages(tree) {
          Object.entries(tree).forEach(([key, value]) => {
            if (value.__file && value.__file.path.endsWith('index.md')) {
              // Look for subpages (e.g. `page/subpage/index.md`)
              const subpages = Object.entries(tree).filter(([subKey, subValue]) => {
                return subValue.__file && subValue.__file.path.startsWith(`${key}/`) && subValue.__file.path.endsWith('index.md')
              }).map(([subKey]) => subKey)

              if (subpages.length > 0) {
                value.subpages = buildTree(subpages.map(sub => ({
                  path: `${key}/${sub}/index.md`,
                  type: 'blob',
                })))
              }
            }
            if (value.subpages) {
              addSubpages(value.subpages)
            }
          })
        }

        addSubpages(fileTree)
        setFiles(fileTree)
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
