import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import profilePhoto from "../assets/profile-photo.png";

const iconPaths = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
  pin: <><path d="m16 3 5 5-4 1-4 4 1 4-2 2-4-6-6-4 2-2 4 1 4-4z" /><path d="m2 22 7-7" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
};

function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function Dashboard() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeNote, setActiveNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("lovely-notes-user") || "{}");
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    let active = true;

    apiRequest("/notes")
      .then((data) => {
        if (!active) return;
        setNotes(data.notes);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("lovely-notes-user");
          navigate("/", { replace: true });
          return;
        }
        setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, reloadKey]);

  const retryLoadingNotes = () => {
    setError("");
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const visibleNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesFilter = filter === "all" || note.isPinned;
      const matchesQuery =
        !normalizedQuery ||
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.content.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, notes, query]);

  const openNewNote = () => {
    setActiveNote(null);
    setTitle("");
    setContent("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditNote = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setActiveNote(null);
  };

  const saveNote = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setFormError("Give your note a title before saving.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const data = await apiRequest(
        activeNote ? `/notes/${activeNote._id}` : "/notes/create",
        {
          method: activeNote ? "PATCH" : "POST",
          body: JSON.stringify({ title: title.trim(), content: content.trim() }),
        }
      );
      setNotes((current) => {
        const next = activeNote
          ? current.map((note) => (note._id === data.note._id ? data.note : note))
          : [data.note, ...current];
        return next.sort(
          (first, second) =>
            Number(second.isPinned) - Number(first.isPinned) ||
            new Date(second.updatedAt) - new Date(first.updatedAt)
        );
      });
      setModalOpen(false);
      setActiveNote(null);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePinned = async (note) => {
    try {
      const data = await apiRequest(`/notes/${note._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      setNotes((current) =>
        current
          .map((item) => (item._id === data.note._id ? data.note : item))
          .sort(
            (first, second) =>
              Number(second.isPinned) - Number(first.isPinned) ||
              new Date(second.updatedAt) - new Date(first.updatedAt)
          )
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteNote = async (note) => {
    if (!window.confirm(`Delete "${note.title}"? This can't be undone.`)) return;
    try {
      await apiRequest(`/notes/${note._id}`, { method: "DELETE" });
      setNotes((current) => current.filter((item) => item._id !== note._id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("lovely-notes-user");
    navigate("/", { replace: true });
  };

  const firstName = user.name?.trim().split(/\s+/)[0] || "friend";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand sidebar-brand" to="/dashboard">
          <span className="brand-mark">l</span>
          Lovely Notes
        </Link>

        <div className="sidebar-section-label">YOUR SPACE</div>
        <nav className="sidebar-nav" aria-label="Note filters">
          <button
            className={`nav-item ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <Icon name="grid" />
            <span>All notes</span>
            <span className="nav-count">{notes.length}</span>
          </button>
          <button
            className={`nav-item ${filter === "pinned" ? "active" : ""}`}
            onClick={() => setFilter("pinned")}
          >
            <Icon name="pin" />
            <span>Pinned</span>
            <span className="nav-count">{notes.filter((note) => note.isPinned).length}</span>
          </button>
        </nav>

        <div className="sidebar-tip">
          <span className="tip-icon"><Icon name="heart" size={17} /></span>
          <p>Little by little, a little becomes a lot.</p>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">{firstName.charAt(0).toUpperCase()}</div>
          <div className="profile-copy">
            <strong>{user.name || "Your space"}</strong>
            <span>{user.email || "Lovely Notes member"}</span>
          </div>
          <button className="icon-button logout-button" onClick={logout} aria-label="Log out" title="Log out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="mobile-brand">
            <Link className="brand" to="/dashboard">
              <span className="brand-mark">l</span>
              Lovely Notes
            </Link>
          </div>
          <div className="topbar-spacer" />
          <div className="topbar-date">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</div>
          <button className="icon-button topbar-logout" onClick={logout} aria-label="Log out" title="Log out">
            <Icon name="logout" />
          </button>
        </header>

        <section className="dashboard-content">
          <div className="welcome-row">
            <div className="welcome-copy">
              <span className="eyebrow">YOUR PERSONAL NOTEBOOK</span>
              <h1>A lovely day, {firstName}<span className="heading-period">.</span></h1>
              <p className="welcome-subtitle">A little space for all the things on your mind.</p>
              <button className="primary-button new-note-button" onClick={openNewNote}>
                <Icon name="plus" size={19} />
                New note
              </button>
            </div>
            <div className="welcome-photo-frame">
              <img className="welcome-photo" src={profilePhoto} alt="Your Lovely Notes profile" />
            </div>
          </div>

          <div className="notes-toolbar">
            <div>
              <h2>{filter === "pinned" ? "Pinned notes" : "All your notes"}</h2>
              <p>{notes.length === 1 ? "One thought saved" : `${notes.length} thoughts saved`}</p>
            </div>
            <label className="search-field">
              <Icon name="search" />
              <input
                type="search"
                placeholder="Search your notes"
                aria-label="Search your notes"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                  <Icon name="close" size={16} />
                </button>
              )}
            </label>
          </div>

          {error && (
            <div className="dashboard-error" role="alert">
              <span>{error}</span>
              <button
                onClick={retryLoadingNotes}
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="notes-loading" aria-label="Loading notes">
              <span /><span /><span />
            </div>
          ) : visibleNotes.length ? (
            <div className="notes-grid">
              {visibleNotes.map((note, index) => (
                <article className={`note-card note-tone-${index % 4}`} key={note._id}>
                  <div className="note-card-top">
                    <span className="note-date">{formatDate(note.updatedAt || note.createdAt)}</span>
                    <div className="note-actions">
                      <button
                        className={`icon-button note-action ${note.isPinned ? "is-pinned" : ""}`}
                        onClick={() => togglePinned(note)}
                        aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                        title={note.isPinned ? "Unpin note" : "Pin note"}
                      >
                        <Icon name="pin" size={17} />
                      </button>
                      <button className="icon-button note-action" onClick={() => openEditNote(note)} aria-label="Edit note" title="Edit note">
                        <Icon name="edit" size={17} />
                      </button>
                      <button className="icon-button note-action delete-action" onClick={() => deleteNote(note)} aria-label="Delete note" title="Delete note">
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </div>
                  <button className="note-card-content" onClick={() => openEditNote(note)}>
                    <h3>{note.title}</h3>
                    <p>{note.content || "A lovely thought, waiting to be filled in..."}</p>
                  </button>
                  <div className="note-card-footer">
                    <span><Icon name="note" size={15} /> Note</span>
                    {note.isPinned && <span className="pinned-label"><Icon name="pin" size={13} /> Pinned</span>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-illustration"><Icon name={query ? "search" : filter === "pinned" ? "pin" : "note"} size={29} /></div>
              <h3>{query ? "No notes found" : filter === "pinned" ? "Nothing pinned just yet" : "Your page is waiting"}</h3>
              <p>
                {query
                  ? "Try another search, or clear the search field."
                  : filter === "pinned"
                    ? "Pin a note you want to keep close and it will show up here."
                    : "Save that first little thought. You can always come back to it."}
              </p>
              {!query && filter === "all" && (
                <button className="primary-button empty-create-button" onClick={openNewNote}>
                  <Icon name="plus" size={18} />
                  Write your first note
                </button>
              )}
            </div>
          )}
          <footer className="dashboard-footer">Made with care, for all your little thoughts <span>✳</span></footer>
        </section>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <section className="note-modal" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">{activeNote ? "MAKE IT JUST RIGHT" : "CATCH THAT THOUGHT"}</span>
                <h2 id="note-modal-title">{activeNote ? "Edit your note" : "A new note"}</h2>
              </div>
              <button className="icon-button modal-close" onClick={closeModal} aria-label="Close note editor">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={saveNote}>
              <label htmlFor="note-title">Title</label>
              <input
                id="note-title"
                className="note-title-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give this thought a name"
                maxLength={120}
                autoFocus
                required
              />
              <label htmlFor="note-content">Your note</label>
              <textarea
                id="note-content"
                className="note-content-input"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Let your thoughts wander..."
                rows={8}
              />
              {formError && <p className="form-message form-error" role="alert">{formError}</p>}
              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={closeModal} disabled={saving}>Cancel</button>
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : activeNote ? "Save changes" : "Save note"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
