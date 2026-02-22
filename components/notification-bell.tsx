"use client"

import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  data?: { bounty_id?: string; milestone_id?: string; lab_id?: string }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function notifLink(n: Notification) {
  if (n.data?.bounty_id) return `/dashboard/bounties/${n.data.bounty_id}`
  if (n.data?.lab_id) return `/admin`
  return '/dashboard'
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const { notifications: data, unreadCount } = await res.json()
        setNotifications(data || [])
        setUnread(unreadCount || 0)
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(n => n.map(x => ({ ...x, read: true })))
    setUnread(0)
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }

  if (!isAuthenticated) return null

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) fetchNotifications() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Bell className="w-4 h-4 text-muted-foreground" />
          )}
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-sm font-medium text-foreground">Notifications</span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border/30">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <Link
                key={n.id}
                href={notifLink(n)}
                className={cn(
                  "flex gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors block",
                  !n.read && "bg-accent/5"
                )}
                onClick={() => { if (!n.read) markRead(n.id); setOpen(false) }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-xs font-medium leading-snug", n.read ? "text-muted-foreground" : "text-foreground")}>
                      {n.title}
                    </p>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
