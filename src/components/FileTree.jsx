import React, { useEffect, useState } from 'react'

async function fetchRepoTree(token, repo, branch) {
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
    headers: {
      Authorization: `token ${token}`,
    },
  })
  const data = await res.json()
  return data.tree.filter(item => item.type === 'blob' && item.path.endsWith('.md'))
}

export default function FileTree({ token, setSelectedPath, repo, branch }) {
  const [files, setFiles] = useState([])

  useEffect(() => {
    if (!token) return
    fetchRepoTree(token, repo, branch).then(setFiles)
  }, [token])

  return (
    <div>
      <h3>📁 Pages</h3>
      <ul>
        {files.map(file => (
          <li key={file.path}>
            <button onClick={() => setSelectedPath(file.path)} style={{ background: 'none', border: 'none', textAlign: 'left' }}>
              {file.path}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
