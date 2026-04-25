'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    await new Promise(r => setTimeout(r, 800));

    setSubmitting(false);
    setSubmitted(true);
    toast({
      title: 'Message sent',
      description: "Thanks! We'll get back to you within a few hours.",
    });
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid">
        <div className="form-field">
          <Label htmlFor="name" className="form-label">Full name</Label>
          <Input id="name" name="name" required placeholder="Jane Doe" data-testid="input-contact-name" />
        </div>
        <div className="form-field">
          <Label htmlFor="email" className="form-label">Email address</Label>
          <Input id="email" name="email" type="email" required placeholder="jane@company.com" data-testid="input-contact-email" />
        </div>
      </div>
      <div className="form-field">
        <Label htmlFor="subject" className="form-label">Subject</Label>
        <Input id="subject" name="subject" required placeholder="How can we help?" data-testid="input-contact-subject" />
      </div>
      <div className="form-field">
        <Label htmlFor="message" className="form-label">Message</Label>
        <Textarea id="message" name="message" required placeholder="Tell us a bit more…" className="min-h-32" data-testid="input-contact-message" />
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
