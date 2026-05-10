/**
 * @param {{
 *   view: 'browse' | 'saved' | 'post',
 *   user: { id: string, name: string, email: string } | null,
 *   onHome: () => void,
 *   onSaved: () => void,
 *   onPost: () => void,
 *   onSignOut: () => void,
 * }} props
 */
export default function HeaderNav({ view, user, onHome, onSaved, onPost, onSignOut }) {
  return (
    <header className="header">
      <a className="logo" href="/" id="logo-home" onClick={(e) => { e.preventDefault(); onHome() }}>
        HittaEvent
      </a>
      <nav className="nav" aria-label="Main">
        <button type="button" className={`nav__link ${view === 'browse' ? 'nav__link--active' : ''}`} id="nav-home" aria-current={view === 'browse' ? 'page' : undefined} onClick={onHome}>
          Home
        </button>
        <button type="button" className={`nav__link ${view === 'post' ? 'nav__link--active' : ''}`} id="nav-post" aria-current={view === 'post' ? 'page' : undefined} onClick={onPost}>
          Add Event
        </button>
        <button type="button" className={`nav__link ${view === 'saved' ? 'nav__link--active' : ''}`} id="nav-saved" aria-current={view === 'saved' ? 'page' : undefined} onClick={onSaved}>
          Saved
        </button>
        <span className="nav__user" id="nav-user-label" hidden={!user}>
          {user ? user.name || user.email : ''}
        </span>
        <button type="button" className="nav__link nav__link--subtle" id="nav-signout" hidden={!user} onClick={onSignOut}>
          Sign out
        </button>
      </nav>
    </header>
  )
}
