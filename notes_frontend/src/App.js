import React, { useEffect, useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  // State management
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorNote, setEditorNote] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // URLs for HTTP: adjust if backend changes
  const BASE_URL = '/api/notes'; // Typically /api/notes or similar

  // Theme colors config (from project)
  const themeColors = {
    accent: '#4CAF50',
    primary: '#1976D2',
    secondary: '#FFC107',
    background: 'var(--bg-primary)',
    noteBg: 'var(--bg-secondary)',
    border: 'var(--border-color)',
    text: 'var(--text-primary)'
  };

  // Fetch all notes
  // PUBLIC_INTERFACE
  const fetchNotes = async () => {
    setLoading(true);
    try {
      setError('');
      const resp = await fetch(BASE_URL);
      if (!resp.ok) throw new Error('Failed to fetch notes');
      const data = await resp.json();
      setNotes(data);
    } catch (e) {
      setError(e.message || 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  };

  // Initial notes load
  useEffect(() => {
    fetchNotes();
  }, []);

  // PUBLIC_INTERFACE
  const handleSelectNote = (note) => {
    setSelectedNoteId(note.id);
    setEditorNote({ title: note.title, content: note.content });
  };

  // PUBLIC_INTERFACE
  const handleEditorChange = (e) => {
    const { name, value } = e.target;
    setEditorNote((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // PUBLIC_INTERFACE
  const handleNewNote = () => {
    setSelectedNoteId(null);
    setEditorNote({ title: '', content: '' });
  };

  // PUBLIC_INTERFACE
  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      setSaving(true);
      setError('');
      const resp = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete note');
      await fetchNotes();
      handleNewNote();
    } catch (e) {
      setError(e.message || 'Error deleting note');
    } finally {
      setSaving(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleSave = async (e) => {
    e.preventDefault();
    if (!editorNote.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let resp;
      if (selectedNoteId) {
        // Edit note
        resp = await fetch(`${BASE_URL}/${selectedNoteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editorNote),
        });
      } else {
        // New note
        resp = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editorNote),
        });
      }
      if (!resp.ok) throw new Error('Failed to save note');
      await fetchNotes();
      if (!selectedNoteId) {
        // On create, select last (newest) note
        setSelectedNoteId(null);
        setEditorNote({ title: '', content: '' });
      }
    } catch (e) {
      setError(e.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // Find the selected note (for persistent title changes upon re-selection)
  useEffect(() => {
    if (!selectedNoteId) return;
    const note = notes.find((n) => n.id === selectedNoteId);
    if (note) setEditorNote({ title: note.title, content: note.content });
  }, [selectedNoteId, notes]);

  // UI Layout
  return (
    <div className="notes-root" style={{ background: themeColors.background, color: themeColors.text }}>
      <header className="notes-header" style={{ background: themeColors.primary }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', letterSpacing: '2px' }}>📝 Simple Notes</h1>
      </header>
      <div className="notes-main">
        <aside className="notes-sidebar" style={{ borderRight: `1px solid ${themeColors.border}` }}>
          <div className="notes-sidebar-header">
            <button 
              className="accent-btn"
              style={{ background: themeColors.accent }}
              onClick={handleNewNote}
              disabled={saving}
            >+ New Note</button>
          </div>
          {loading ? (
            <div className="notes-loading">Loading notes...</div>
          ) : (
            <ul className="notes-list">
              {notes.length === 0 && (
                <li className="notes-list-empty">No notes yet</li>
              )}
              {notes.map((note) => (
                <li
                  key={note.id}
                  className={`notes-list-item${selectedNoteId === note.id ? ' selected' : ''}`}
                  onClick={() => handleSelectNote(note)}
                  style={{
                    background: selectedNoteId === note.id ? themeColors.secondary : 'transparent',
                    borderLeft: selectedNoteId === note.id ? `4px solid ${themeColors.accent}` : '4px solid transparent'
                  }}
                >
                  <div className="note-title" title={note.title}>
                    {note.title}
                  </div>
                  <button
                    aria-label="Delete Note"
                    title="Delete"
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    disabled={saving}
                  >🗑️</button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <main className="notes-editor-container">
          <form className="notes-editor" onSubmit={handleSave} autoComplete="off">
            <input
              type="text"
              name="title"
              value={editorNote.title}
              onChange={handleEditorChange}
              placeholder="Note title"
              maxLength={120}
              required
              className="editor-title"
              autoFocus
            />
            <textarea
              name="content"
              value={editorNote.content}
              onChange={handleEditorChange}
              placeholder="Write your note here..."
              rows={12}
              className="editor-content"
              spellCheck={true}
            />
            <div className="editor-actions">
              <button 
                type="submit" 
                className="accent-btn"
                style={{ background: themeColors.accent }} 
                disabled={saving}
              >
                {selectedNoteId ? "Save Changes" : "Add Note"}
              </button>
              <button 
                type="button"
                className="secondary-btn"
                disabled={saving || !selectedNoteId}
                style={{ 
                  background: themeColors.secondary,
                  color: '#000',
                  marginLeft: '8px'
                }}
                onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)}
              >
                Delete
              </button>
            </div>
            {error && <div className="editor-error">{error}</div>}
          </form>
        </main>
      </div>
      <footer className="notes-footer">
        <span style={{ color: '#888', fontSize: '0.92em' }}>
          Simple Notes App • Light, Minimal, React •
        </span>
      </footer>
    </div>
  );
}

export default App;
