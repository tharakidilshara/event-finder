import { useCallback, useEffect, useRef, useState } from 'react'
import { clearSession, fetchMe, getAccessToken, getStoredUser } from './api/auth.js'
import { addSavedEvent, fetchSavedEvents, removeSavedEvent } from './api/saved.js'
import { deleteEvent, fetchEventById } from './api/events.js'
import AuthModal from './components/AuthModal.jsx'
import BrowseView from './components/BrowseView.jsx'
import EventDetailModal from './components/EventDetailModal.jsx'
import HeaderNav from './components/HeaderNav.jsx'
import PostEventForm from './components/PostEventForm.jsx'
import RegisterTicketModal from './components/RegisterTicketModal.jsx'
import SavedView from './components/SavedView.jsx'

export default function App() {
  const [view, setView] = useState(/** @type {'browse' | 'saved' | 'post'} */ ('browse'))
  const [user, setUser] = useState(() => getStoredUser())
  const [savedIds, setSavedIds] = useState(() => new Set())
  const [savedEvents, setSavedEvents] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedError, setSavedError] = useState(/** @type {string | null} */ (null))

  const [authOpen, setAuthOpen] = useState(false)
  const [authStartRegister, setAuthStartRegister] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailEvent, setDetailEvent] = useState(/** @type {object | null} */ (null))
  const [detailFetchLoading, setDetailFetchLoading] = useState(false)
  const [detailActionsDisabled, setDetailActionsDisabled] = useState(false)

  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerCtx, setRegisterCtx] = useState(/** @type {null | { eventId: string, eventTitle: string, isFree: boolean, price: number }} */ (null))

  const [editEvent, setEditEvent] = useState(/** @type {object | null} */ (null))
  const [postPrefetchBusy, setPostPrefetchBusy] = useState(false)

  const browseBufferRef = useRef(/** @type {object[]} */ ([]))
  const authSuccessRef = useRef(/** @type {null | (() => void)} */ (null))

  const refreshSavedList = useCallback(async () => {
    if (!getAccessToken()) {
      setSavedIds(new Set())
      setSavedEvents([])
      return
    }
    setSavedLoading(true)
    setSavedError(null)
    try {
      const items = await fetchSavedEvents()
      setSavedEvents(items)
      setSavedIds(new Set(items.map((e) => e.id)))
    } catch (e) {
      setSavedError(e instanceof Error ? e.message : 'Could not load saved events')
      setSavedEvents([])
    } finally {
      setSavedLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMe().then((u) => {
      setUser(u)
      if (u) void refreshSavedList()
    })
  }, [refreshSavedList])

  useEffect(() => {
    if (view === 'saved') void refreshSavedList()
  }, [view, refreshSavedList])

  useEffect(() => {
    if (authOpen || detailOpen || registerOpen) document.body.classList.add('modal-open')
    else document.body.classList.remove('modal-open')
  }, [authOpen, detailOpen, registerOpen])

  const canManageEvent = useCallback(
    (event) => {
      if (!user || !event) return false
      const cid = event.creatorId ?? event.creator?.id ?? null
      return Boolean(cid && cid === user.id)
    },
    [user],
  )

  const openAuth = useCallback((opts = {}) => {
    setAuthStartRegister(Boolean(opts.startInRegister))
    authSuccessRef.current = opts.onSuccess ?? null
    setAuthOpen(true)
  }, [])

  const handleAuthSuccess = useCallback(() => {
    setUser(getStoredUser())
    void refreshSavedList()
    const next = authSuccessRef.current
    authSuccessRef.current = null
    next?.()
  }, [refreshSavedList])

  const toggleSave = useCallback(
    async (eventId) => {
      if (!getAccessToken()) {
        openAuth({
          onSuccess: () => {
            void toggleSave(eventId)
          },
        })
        return
      }
      try {
        if (savedIds.has(eventId)) {
          await removeSavedEvent(eventId)
          setSavedIds((prev) => {
            const n = new Set(prev)
            n.delete(eventId)
            return n
          })
          setSavedEvents((rows) => rows.filter((r) => r.id !== eventId))
        } else {
          await addSavedEvent(eventId)
          setSavedIds((prev) => new Set(prev).add(eventId))
        }
        await refreshSavedList()
      } catch (e) {
        window.alert(e instanceof Error ? e.message : 'Save failed')
      }
    },
    [openAuth, refreshSavedList, savedIds],
  )

  const openEventById = useCallback(
    async (id) => {
      if (!id) return
      let ev = browseBufferRef.current.find((x) => x.id === id) ?? savedEvents.find((x) => x.id === id)
      if (!ev) {
        setDetailFetchLoading(true)
        setDetailEvent(null)
        setDetailOpen(true)
        try {
          ev = await fetchEventById(id)
          setDetailEvent(ev)
        } catch {
          setDetailOpen(false)
        } finally {
          setDetailFetchLoading(false)
        }
        return
      }
      setDetailEvent(ev)
      setDetailOpen(true)
    },
    [savedEvents],
  )

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailEvent(null)
    setDetailFetchLoading(false)
    setDetailActionsDisabled(false)
  }, [])

  const goBrowse = useCallback(() => {
    setEditEvent(null)
    setView('browse')
  }, [])

  const goPost = useCallback(() => {
    if (!getAccessToken()) {
      openAuth({
        onSuccess: () => {
          setEditEvent(null)
          setView('post')
        },
      })
      return
    }
    setEditEvent(null)
    setView('post')
  }, [openAuth])

  const goSaved = useCallback(() => {
    setEditEvent(null)
    setView('saved')
  }, [])

  const onSignOut = useCallback(() => {
    clearSession()
    setUser(null)
    setSavedIds(new Set())
    setSavedEvents([])
    setEditEvent(null)
    setView('browse')
  }, [])

  const afterMutation = useCallback(() => {
    window.dispatchEvent(new Event('ef:reload-events'))
    void refreshSavedList()
  }, [refreshSavedList])

  return (
    <div className="page">
      <HeaderNav view={view} user={user} onHome={goBrowse} onSaved={goSaved} onPost={goPost} onSignOut={onSignOut} />

      <main className="main">
        {view === 'browse' ? (
          <BrowseView
            savedIds={savedIds}
            onOpenEvent={(id) => void openEventById(id)}
            onToggleSave={(id) => void toggleSave(id)}
            onBrowseBufferChange={(rows) => {
              browseBufferRef.current = rows
            }}
          />
        ) : null}

        {view === 'saved' ? (
          <SavedView
            events={savedEvents}
            loading={savedLoading}
            error={savedError}
            savedIds={savedIds}
            onOpenEvent={(id) => void openEventById(id)}
            onToggleSave={(id) => void toggleSave(id)}
          />
        ) : null}

        {view === 'post' ? (
          <div id="view-post" className="view-panel">
            {postPrefetchBusy ? (
              <div className="post-panel__busy" aria-live="polite">
                <span className="loading-spinner loading-spinner--accent" aria-hidden="true" />
                <p className="post-panel__busy-text">Loading event for editing…</p>
              </div>
            ) : null}
            <PostEventForm
              editEvent={editEvent}
              onClearEdit={() => setEditEvent(null)}
              onCancel={() => {
                setEditEvent(null)
                goBrowse()
              }}
              onDone={() => {
                setEditEvent(null)
                goBrowse()
                afterMutation()
              }}
            />
          </div>
        ) : null}
      </main>

      <footer className="footer" />

      <EventDetailModal
        open={detailOpen}
        event={detailEvent}
        fetchLoading={detailFetchLoading}
        isSaved={detailEvent ? savedIds.has(detailEvent.id) : false}
        canManage={detailEvent ? canManageEvent(detailEvent) : false}
        onClose={closeDetail}
        onToggleSave={() => {
          if (!detailEvent) return
          void toggleSave(detailEvent.id).then(() => {
            setDetailEvent((d) => (d ? { ...d } : d))
          })
        }}
        onEdit={() => {
          if (!detailEvent) return
          closeDetail()
          setView('post')
          setPostPrefetchBusy(true)
          void (async () => {
            try {
              let ev = browseBufferRef.current.find((x) => x.id === detailEvent.id) ?? detailEvent
              if (!ev?.startsAt) ev = await fetchEventById(detailEvent.id)
              setEditEvent(ev)
            } catch {
              window.alert('Could not load event for editing.')
            } finally {
              setPostPrefetchBusy(false)
            }
          })()
        }}
        onDelete={() => {
          if (!detailEvent) return
          if (!window.confirm('Delete this event permanently? This cannot be undone.')) return
          setDetailActionsDisabled(true)
          void (async () => {
            try {
              await deleteEvent(detailEvent.id)
              closeDetail()
              afterMutation()
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Delete failed'
              if (/sign in|session|401/i.test(msg)) openAuth({ onSuccess: () => {} })
              else window.alert(msg)
            } finally {
              setDetailActionsDisabled(false)
            }
          })()
        }}
        onRegister={() => {
          if (!detailEvent) return
          const isFree = detailEvent.isFree !== false && !(Number(detailEvent.price) > 0)
          const price = Number(detailEvent.price) > 0 ? Number(detailEvent.price) : 0
          setRegisterCtx({
            eventId: detailEvent.id,
            eventTitle: detailEvent.title,
            isFree,
            price,
          })
          setRegisterOpen(true)
        }}
        actionsDisabled={detailActionsDisabled}
      />

      <RegisterTicketModal
        open={registerOpen}
        context={registerCtx}
        onClose={() => {
          setRegisterOpen(false)
          setRegisterCtx(null)
        }}
        onSubmit={(payload) => {
          console.info('[HittaEvent mock booking]', payload)
        }}
      />

      <AuthModal open={authOpen} startRegister={authStartRegister} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}
