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

function renderTree(tree, pathPrefix = '', onSelect) {
  return Object.entries(tree).map(([name, value]) => {
    const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name

    // Show folders with just an index.md
    if (value.__file && value.__file.path.endsWith('index.md')) {
      return (
        <li key={fullPath}>
          📄 <button onClick={() => onSelect(fullPath)}>{name.replace('index.md', '') || name}</button>
          {value.subpages && (
            <ul>{renderTree(value.subpages, fullPath, onSelect)}</ul>
          )}
        </li>
      )
    }

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

    return (
      <li key={fullPath}>
        📄 <button onClick={() => onSelect(fullPath)}>{name.replace('.md', '')}</button>
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
          item => item.type === 'blob' && item.path.endsWith('.md')
        )

        const tree = buildTree(markdownFiles)

        function addSubpages(tree) {
          Object.entries(tree).forEach(([key, value]) => {
            if (value.__file && value.__file.path.endsWith('index.md')) {
              const subpages = Object.entries(tree).filter(([subKey, subValue]) =>
                subValue.__file &&
                subValue.__file.path.startsWith(`${key}/`) &&
                subValue.__file.path.endsWith('index.md')
              ).map(([subKey]) => subKey)

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

        addSubpages(tree)
        setFileTree(tree)
      })
      .catch(err => {
        console.error("Failed to fetch file tree:", err)
        setFileTree({})
      })
  }, [token])

  return (
    <div>
      <h3>📘 Wiki Pages</h3>
      <ul>{renderTree(fileTree, '', setSelectedPath)}</ul>
    </div>
  )
}
