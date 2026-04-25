'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Inbox, Mail, Search, Trash2, Reply, Archive, Eye,
  CheckCircle2, MailOpen, Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import {
  type ContactMessage, type ContactMessageStatus, CONTACT_MESSAGE_STATUSES,
} from '@/lib/types';

const STATUS_META: Record<ContactMessageStatus, { label: string; className: string; icon: any }> = {
  new:      { label: 'New',      className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', icon: Mail },
  read:     { label: 'Read',     className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',         icon: MailOpen },
  replied:  { label: 'Replied',  className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
  archived: { label: 'Archived', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',     icon: Archive },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function MessagesManagementClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ContactMessageStatus>('all');
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [notes, setNotes] = useState('');

  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact'],
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Partial<ContactMessage> }) =>
      apiRequest('PATCH', `/api/contact/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/contact'] }),
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => apiRequest('DELETE', `/api/contact/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact'] });
      setActive(null);
      toast({ title: 'Message deleted' });
    },
    onError: (e: any) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  const counts = useMemo(() => {
    const c = { all: messages.length, new: 0, read: 0, replied: 0, archived: 0 };
    for (const m of messages) c[m.status] += 1;
    return c;
  }, [messages]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter(m => {
      if (filter !== 'all' && m.status !== filter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, filter, search]);

  const openMessage = (m: ContactMessage) => {
    setActive(m);
    setNotes(m.admin_notes ?? '');
    if (m.status === 'new') {
      updateMut.mutate({ id: m.id, body: { status: 'read' } });
    }
  };

  const replyByEmail = (m: ContactMessage) => {
    const subject = encodeURIComponent(`Re: ${m.subject}`);
    const body = encodeURIComponent(`\n\n---\nOn ${new Date(m.created_at).toLocaleString()}, ${m.name} wrote:\n${m.message}`);
    window.location.href = `mailto:${m.email}?subject=${subject}&body=${body}`;
    updateMut.mutate({ id: m.id, body: { status: 'replied' } });
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="page-eyebrow">Operations</p>
        <h1 className="page-title flex items-center gap-3" data-testid="text-messages-title">
          <Inbox className="w-7 h-7 text-indigo-600" />
          Contact Inbox
        </h1>
        <p className="page-subtitle">Messages submitted through the public contact form.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {([
          { key: 'all',      label: 'Total',    icon: Mail,         color: 'text-slate-700 dark:text-slate-200' },
          { key: 'new',      label: 'New',      icon: Mail,         color: 'text-indigo-600' },
          { key: 'read',     label: 'Read',     icon: MailOpen,     color: 'text-slate-500' },
          { key: 'replied',  label: 'Replied',  icon: CheckCircle2, color: 'text-emerald-600' },
          { key: 'archived', label: 'Archived', icon: Archive,      color: 'text-amber-600' },
        ] as const).map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as any)}
              className={`surface-card p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
                filter === s.key ? 'ring-2 ring-indigo-500' : ''
              }`}
              data-testid={`filter-${s.key}`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs font-medium text-slate-500">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, subject or content…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-messages"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading messages…</div>
          ) : visible.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500" data-testid="text-no-messages">
                {messages.length === 0 ? 'No messages yet.' : 'No messages match your filter.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {visible.map(m => {
                const meta = STATUS_META[m.status];
                const StatusIcon = meta.icon;
                return (
                  <li key={m.id} data-testid={`row-message-${m.id}`}>
                    <button
                      onClick={() => openMessage(m)}
                      className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-4"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.className}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={`font-semibold text-sm truncate ${m.status === 'new' ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {m.name}
                          </p>
                          <span className="text-xs text-slate-500">·</span>
                          <p className="text-xs text-slate-500 truncate">{m.email}</p>
                          <Badge variant="secondary" className={`${meta.className} text-[10px] uppercase tracking-wide`}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className={`text-sm truncate ${m.status === 'new' ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {m.subject}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{m.message}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeAgo(m.created_at)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 pr-6" data-testid="text-detail-subject">
                  {active.subject}
                </DialogTitle>
                <DialogDescription>
                  From <span className="font-medium text-slate-700 dark:text-slate-300">{active.name}</span>{' '}
                  &lt;{active.email}&gt; · {new Date(active.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500">Status:</span>
                  <Select
                    value={active.status}
                    onValueChange={(v: ContactMessageStatus) =>
                      updateMut.mutate({ id: active.id, body: { status: v } })
                    }
                  >
                    <SelectTrigger className="w-40 h-9" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_MESSAGE_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap" data-testid="text-detail-message">
                    {active.message}
                  </p>
                </div>

                <div>
                  <label className="form-label flex items-center gap-2 mb-1">
                    <Eye className="w-3.5 h-3.5" /> Internal notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes only visible to admins…"
                    className="min-h-24"
                    data-testid="input-notes"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateMut.mutate({ id: active.id, body: { admin_notes: notes } })}
                      disabled={updateMut.isPending}
                      data-testid="button-save-notes"
                    >
                      Save notes
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    onClick={() => replyByEmail(active)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    data-testid="button-reply-email"
                  >
                    <Reply className="w-4 h-4 mr-2" /> Reply by Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateMut.mutate({ id: active.id, body: { status: 'archived' } })}
                    data-testid="button-archive"
                  >
                    <Archive className="w-4 h-4 mr-2" /> Archive
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 ml-auto"
                    onClick={() => {
                      if (confirm('Delete this message? This cannot be undone.')) {
                        deleteMut.mutate(active.id);
                      }
                    }}
                    disabled={deleteMut.isPending}
                    data-testid="button-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
