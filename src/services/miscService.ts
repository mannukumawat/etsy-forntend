import { mockRequest, newId } from './api';

// Demo-only form handlers. Nothing is sent or stored anywhere.
// Phase 2: POST /api/newsletter and POST /api/contact (with spam protection and rate limiting).

export const newsletterService = {
  subscribe(_email: string): Promise<{ ok: true }> {
    return mockRequest(() => ({ ok: true as const }), [500, 900]);
  },
};

export const contactService = {
  send(_message: { name: string; email: string; subject: string; message: string }): Promise<{ reference: string }> {
    return mockRequest(() => ({ reference: newId('demo').toUpperCase().slice(0, 13) }), [700, 1100]);
  },
};
