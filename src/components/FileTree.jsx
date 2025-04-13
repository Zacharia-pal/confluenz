import React, { useEffect, useState } from 'react'

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

function renderTree(tree, pathPrefix = '', onSelect, selectedPath) {
  return Object.entries(tree).map(([name, value]) => {
    const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name
    const displayName = name.replace(/\.md$/, '')

    if (value.__file) {
      const isActive = fullPath === selectedPath
      return (
        <li key={fullPath}>
          📄{' '}
          <button
            style={{
              fontWeight: isActive ? 'bold' : 'normal',
              backgroundColor: isActive ? '#e0f7fa' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => onSelect(fullPath)}
          >
            {displayName}
          </button>
        </li>
      )
    } else {
      return (
        <li key={fullPath}>
          📁 <details open={selectedPath?.startsWith(fullPath)}>
            <summary>{displayName}</summary>
            <ul style={{ marginLeft: '1rem' }}>
              {renderTree(value, fullPath, onSelect, selectedPath)}
            </ul>
          </details>
        </li>
      )
    }
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
        const markdownFiles = data.tree.filter(item => item.type === 'blob' && item.path.endsWith('.md'))
        setFiles(markdownFiles)
      })
  }, [token])

  const fileTree = buildTree(files)

  return (
    <div>
      <h3>📘 Wiki Pages</h3>
      <ul>{renderTree(fileTree, '', setSelectedPath, setSelectedPath.currentPath)}</ul>
    </div>
  )
}
