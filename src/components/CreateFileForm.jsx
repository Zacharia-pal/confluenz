// src/components/CreateFileForm.jsx
import { useState } from 'react';

export default function CreateFileForm({ onCreate }) {
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onCreate(path, content);
    setPath(''); // Reset path
    setContent(''); // Reset content
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b">
      <h3 className="text-lg font-semibold mb-2">Create New File</h3>
      <input
        className="border p-1 mr-2 w-1/2"
        placeholder="path/to/file.md"
        value={path}
        onChange={e => setPath(e.target.value)}
      />
      <textarea
        className="border p-1 w-full mt-2"
        placeholder="Initial content..."
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <button type="submit" className="mt-2 bg-green-600 text-white px-4 py-2">Create</button>
    </form>
  );
}
