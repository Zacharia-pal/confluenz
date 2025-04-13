import React, { useEffect, useState } from 'react'
import { marked } from 'marked'

export default function MarkdownView({ token, repo, branch, path }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!path) return

    fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        Authorization: `token ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const decoded = atob(data.content)
        setContent(decoded)
      })
  }, [path])

  return (
    <div dangerouslySetInnerHTML={{ __html: marked(content) }} />
  )
}
