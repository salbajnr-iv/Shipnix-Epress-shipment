'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import type { FaqItem } from '@/lib/site-config';

export default function FAQClient({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-lg">Find answers to common questions about our services</p>
      </div>

      <input
        type="text"
        placeholder="Search questions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        data-testid="input-faq-search"
      />

      <div className="space-y-3">
        {filtered.map((faq, i) => (
          <Card key={i} className="overflow-hidden" data-testid={`card-faq-${i}`}>
            <button
              className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
              data-testid={`button-faq-${i}`}
            >
              <span className="font-medium text-gray-900 dark:text-white">{faq.q}</span>
              {open === i ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
            </button>
            {open === i && (
              <CardContent className="pt-0 px-5 pb-5">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{faq.a}</p>
              </CardContent>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            {faqs.length === 0 ? 'No questions have been added yet.' : 'No questions match your search'}
          </div>
        )}
      </div>
    </div>
  );
}
