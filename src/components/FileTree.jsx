import React, { useEffect, useState } from 'react'

// Build a tree only from index.md files
function buildIndexTree(files) {
  const root = {}

  for (const file of files) {
    if (!file.path.endsWith('index.md')) continue

    const parts = file.path.split('/')
    const folderPath = parts.slice(0, -1) // remove index.md
    let current = root

    folderPath.forEach((part, i) => {
      if (!current[part]) current[part] = {}
      current = current[part]
    })

    // Attach the index.md file at the folder level
    current.__file = file
  }

  return root
}

function renderIndexTree(tree, pathPrefix = '', onSelect) {
  return Object.entries(tree).map(([name, value]) => {
    if (name === '__file') return null // handled below

    const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name
    const hasIndex = value.__file

    return (
      <li key={fullPath}>
        {hasIndex && (
          <>
            📄 <button onClick={() => onSelect(`${fullPath}/index.md`)}>{name}</button>
          </>
        )}
        {Object.keys(value).some(k => k !== '__file') && (
          <ul>
            {renderIndexTree(value, fullPath, onSelect)}
          </ul>
        )}
      </li>
    )
  })
}

export default function FileTree({ token, setSelectedPath, repo, branch }) {
  const [fileTree, setFileTree] = useState({})

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
      <ul>{renderIndexTree(fileTree, '', setSelectedPath)}</ul>
    </div>
  )
}
