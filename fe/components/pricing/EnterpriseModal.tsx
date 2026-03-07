'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

interface EnterpriseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EnterpriseModal({ open, onOpenChange }: EnterpriseModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, message }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        onOpenChange(false);
        setName(''); setEmail(''); setCompany(''); setMessage('');
      } else {
        toast.error(data.message || 'Something went wrong');
      }
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Contact Enterprise Sales</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Tell us about your needs and we&apos;ll get back to you within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <Input
            placeholder="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
          <Input
            type="email"
            placeholder="Work Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
          <Input
            placeholder="Company Name"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
          <Textarea
            placeholder="Tell us about your use case..."
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 resize-none"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
