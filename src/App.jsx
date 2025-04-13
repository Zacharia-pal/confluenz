// src/App.jsx
import React, { useEffect, useState } from 'react'
import MarkdownView from './components/MarkdownView'
import FileTree from './components/FileTree'
import Editor from './components/Editor'
import Login from './components/Login'

const GITHUB_REPO = 'zacharia-pal/confluenz' // Replace this
const BRANCH = 'main'

function App() {
  const [token, setToken] = useState('')
  const [selectedPath, setSelectedPath] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [mode, setMode] = useState('view') // or 'edit'

  return (
    <div className="app" style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <Login token={token} setToken={setToken} />
        <FileTree token={token} setSelectedPath={setSelectedPath} repo={GITHUB_REPO} branch={BRANCH} />
      </div>

      <div style={{ flex: 1, padding: '1rem' }}>
        {mode === 'view' && (
          <>
            <button onClick={() => setMode('edit')}>Edit</button>
            <MarkdownView token={token} repo={GITHUB_REPO} branch={BRANCH} path={selectedPath} />
          </>
        )}

        {mode === 'edit' && (
          <Editor
            token={token}
            repo={GITHUB_REPO}
            branch={BRANCH}
            path={selectedPath}
            onDone={() => setMode('view')}
          />
        )}
      </div>
    </div>
  )
}

export default App
