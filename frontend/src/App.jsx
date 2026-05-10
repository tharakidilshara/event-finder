import { useCallback, useEffect, useRef, useState } from 'react'
import { clearSession, fetchMe, getAccessToken, getStoredUser } from './api/auth.js'
import { addSavedEvent, fetchSavedEvents, removeSavedEvent } from './api/saved.js'
import { deleteEvent, fetchEventById, fetchEventsByUser } from './api/events.js'
import AuthModal from './components/AuthModal.jsx'
import ConfirmDeleteEventModal from './components/ConfirmDeleteEventModal.jsx'
import BrowseView from './components/BrowseView.jsx'
import EventDetailModal from './components/EventDetailModal.jsx'
import HeaderNav from './components/HeaderNav.jsx'
import PostEventForm from './components/PostEventForm.jsx'
import RegisterTicketModal from './components/RegisterTicketModal.jsx'
import MyEventsView from './components/MyEventsView.jsx'
import SavedView from './components/SavedView.jsx'

export default function App() {
  const [view, setView] = useState(/** @type {'browse' | 'saved' | 'post' | 'mine'} */ ('browse'))
  const [user, setUser] = useState(() => getStoredUser())
  const [savedIds, setSavedIds] = useState(() => new Set())
  const [savedEvents, setSavedEvents] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedError, setSavedError] = useState(/** @type {string | null} */ (null))

  const [myPublishedEvents, setMyPublishedEvents] = useState(/** @type {object[]} */ ([]))
  const [myPublishedLoading, setMyPublishedLoading] = useState(false)
  const [myPublishedError, setMyPublishedError] = useState(/** @type {string | null} */ (null))

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

  /** Pending delete: which event and whether it was opened from My events or the detail modal. */
  const [deleteConfirm, setDeleteConfirm] = useState(/** @type {{ id: string, title: string, source: 'my' | 'detail' } | null} */ (null))
  const [deleteBusy, setDeleteBusy] = useState(false)

  const browseBufferRef = useRef(/** @type {object[]} */ ([]))
  const authSuccessRef = useRef(/** @type {null | (() => void)} */ (null))
  /** After Add Event / edit: return to browse, saved, or my events (not post). */
  const postReturnTargetRef = useRef(/** @type {'browse' | 'saved' | 'mine'} */ ('browse'))

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
    if (view !== 'mine' || !user?.id) return undefined
    let cancelled = false
    setMyPublishedLoading(true)
    setMyPublishedError(null)
    void (async () => {
      try {
        const { events } = await fetchEventsByUser(user.id)
        if (!cancelled) setMyPublishedEvents(Array.isArray(events) ? events : [])
      } catch (e) {
        if (!cancelled) {
          setMyPublishedError(e instanceof Error ? e.message : 'Could not load your events')
          setMyPublishedEvents([])
        }
      } finally {
        if (!cancelled) setMyPublishedLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [view, user?.id])

  useEffect(() => {
    if (authOpen || detailOpen || registerOpen || deleteConfirm) document.body.classList.add('modal-open')
    else document.body.classList.remove('modal-open')
  }, [authOpen, detailOpen, registerOpen, deleteConfirm])

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
    postReturnTargetRef.current = 'browse'
    setView('browse')
  }, [])

  /** Leave post/create form: go back to the tab that opened it (Home, Saved, or My events). */
  const navigateAfterPost = useCallback(() => {
    setEditEvent(null)
    const t = postReturnTargetRef.current
    postReturnTargetRef.current = 'browse'
    if (t === 'saved') setView('saved')
    else if (t === 'mine') setView('mine')
    else setView('browse')
  }, [])

  const goPost = useCallback(() => {
    const returnTo = view === 'saved' ? 'saved' : view === 'mine' ? 'mine' : 'browse'
    const enterPost = () => {
      postReturnTargetRef.current = returnTo
      setEditEvent(null)
      setView('post')
    }
    if (!getAccessToken()) {
      openAuth({
        onSuccess: () => {
          enterPost()
        },
      })
      return
    }
    enterPost()
  }, [openAuth, view])

  const goSaved = useCallback(() => {
    setEditEvent(null)
    setView('saved')
  }, [])

  const goMine = useCallback(() => {
    if (!getAccessToken()) {
      openAuth({
        onSuccess: () => {
          setEditEvent(null)
          setView('mine')
        },
      })
      return
    }
    setEditEvent(null)
    setView('mine')
  }, [openAuth])

  const onSignOut = useCallback(() => {
    clearSession()
    setUser(null)
    setSavedIds(new Set())
    setSavedEvents([])
    setMyPublishedEvents([])
    setMyPublishedError(null)
    setEditEvent(null)
    postReturnTargetRef.current = 'browse'
    setView('browse')
  }, [])

  const afterMutation = useCallback(() => {
    window.dispatchEvent(new Event('ef:reload-events'))
    void refreshSavedList()
  }, [refreshSavedList])

  const openDeleteConfirmFromMyList = useCallback(
    (eventId) => {
      const row = myPublishedEvents.find((r) => r.id === eventId)
      setDeleteConfirm({ id: eventId, title: String(row?.title ?? 'This event'), source: 'my' })
    },
    [myPublishedEvents],
  )

  const runConfirmedDelete = useCallback(async () => {
    const pending = deleteConfirm
    if (!pending) return
    setDeleteBusy(true)
    try {
      await deleteEvent(pending.id)
      setDeleteConfirm(null)
      if (pending.source === 'detail') {
        closeDetail()
      } else {
        setMyPublishedEvents((rows) => rows.filter((r) => r.id !== pending.id))
      }
      afterMutation()
      await refreshSavedList()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed'
      if (/sign in|session|401/i.test(msg)) openAuth({ onSuccess: () => {} })
      else window.alert(msg)
    } finally {
      setDeleteBusy(false)
    }
  }, [deleteConfirm, closeDetail, afterMutation, refreshSavedList, openAuth])

  const handleEditMyEvent = useCallback((eventId) => {
    postReturnTargetRef.current = 'mine'
    setView('post')
    setPostPrefetchBusy(true)
    void (async () => {
      try {
        let ev =
          myPublishedEvents.find((x) => x.id === eventId) ?? browseBufferRef.current.find((x) => x.id === eventId)
        if (!ev?.startsAt) ev = await fetchEventById(eventId)
        setEditEvent(ev)
      } catch {
        window.alert('Could not load event for editing.')
        setEditEvent(null)
        setView('mine')
      } finally {
        setPostPrefetchBusy(false)
      }
    })()
  }, [myPublishedEvents])

  return (
    <div className="page">
      <HeaderNav view={view} user={user} onHome={goBrowse} onSaved={goSaved} onMine={goMine} onPost={goPost} onSignOut={onSignOut} />

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

        {view === 'mine' && user ? (
          <MyEventsView
            events={myPublishedEvents}
            loading={myPublishedLoading}
            error={myPublishedError}
            savedIds={savedIds}
            onOpenEvent={(id) => void openEventById(id)}
            onToggleSave={(id) => void toggleSave(id)}
            onEditEvent={handleEditMyEvent}
            onDeleteEvent={openDeleteConfirmFromMyList}
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
                navigateAfterPost()
              }}
              onDone={() => {
                setEditEvent(null)
                navigateAfterPost()
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
          const returnTo = view === 'saved' ? 'saved' : view === 'mine' ? 'mine' : 'browse'
          postReturnTargetRef.current = returnTo
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
          setDeleteConfirm({ id: detailEvent.id, title: detailEvent.title, source: 'detail' })
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

      <ConfirmDeleteEventModal
        open={Boolean(deleteConfirm)}
        eventTitle={deleteConfirm?.title ?? ''}
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteConfirm(null)}
        onConfirm={() => void runConfirmedDelete()}
      />

      <AuthModal open={authOpen} startRegister={authStartRegister} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}
