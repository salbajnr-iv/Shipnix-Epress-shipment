'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { Send, CheckCircle2 } from 'lucide-react';

const INITIAL = { name: '', email: '', subject: '', message: '' };

export default function ContactForm() {
  const { toast } = useToast();
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof typeof INITIAL, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await apiRequest('POST', '/api/contact', form);
      setSubmitted(true);
      setForm(INITIAL);
      toast({
        title: 'Message sent',
        description: "Thanks! We'll get back to you within a few hours.",
      });
      setTimeout(() => setSubmitted(false), 3500);
    } catch (err: any) {
      const msg = err?.message?.includes(':')
        ? err.message.split(':').slice(1).join(':').trim()
        : err?.message ?? 'Something went wrong. Please try again.';
      toast({
        title: 'Could not send your message',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid">
        <div className="form-field">
          <Label htmlFor="name" className="form-label">Full name</Label>
          <Input
            id="name"
            name="name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Jane Doe"
            data-testid="input-contact-name"
          />
        </div>
        <div className="form-field">
          <Label htmlFor="email" className="form-label">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="jane@company.com"
            data-testid="input-contact-email"
          />
        </div>
      </div>
      <div className="form-field">
        <Label htmlFor="subject" className="form-label">Subject</Label>
        <Input
          id="subject"
          name="subject"
          required
          value={form.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder="How can we help?"
          data-testid="input-contact-subject"
        />
      </div>
      <div className="form-field">
        <Label htmlFor="message" className="form-label">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Tell us a bit more…"
          className="min-h-32"
          maxLength={5000}
          data-testid="input-contact-message"
        />
      </div>
      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all"
        data-testid="button-contact-submit"
      >
        {submitting ? (
          'Sending…'
        ) : submitted ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Sent
          </>
        ) : (
          <>
            Send Message <Send className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}
