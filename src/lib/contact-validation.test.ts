import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
    insert: vi.fn(), from: vi.fn(), rateLimit: vi.fn(),
}));
vi.mock('./supabase', () => ({ supabase: { from: mock.from } }));
vi.mock('./ratelimit', () => ({ checkRateLimit: mock.rateLimit }));
import { POST } from '../pages/api/contact';

function context(body: unknown) {
    return { request: new Request('http://localhost/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }), clientAddress: '127.0.0.1' } as Parameters<typeof POST>[0];
}

describe('contact validation before the mocked database boundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mock.from.mockReturnValue({ insert: mock.insert });
        mock.insert.mockResolvedValue({ error: null });
        mock.rateLimit.mockResolvedValue({ success: true });
    });

    it('accepts a real-shaped message and strips caller-controlled database fields', async () => {
        const response = await POST(context({ name: 'Test Reader', email: 'reader@example.com',
            message: 'Research enquiry', read: true, id: 99, role: 'admin' }));
        expect(response.status).toBe(200);
        expect(mock.from).toHaveBeenCalledWith('contact_messages');
        expect(mock.insert).toHaveBeenCalledWith([{ name: 'Test Reader', email: 'reader@example.com',
            message: 'Research enquiry', read: false }]);
    });

    it('returns field errors before any database query for invalid input', async () => {
        const response = await POST(context({ name: '', email: 'not-an-email', message: 'Hello' }));
        expect(response.status).toBe(400);
        expect((await response.json()).error).toBe('Invalid input');
        expect(mock.from).not.toHaveBeenCalled();
        expect(mock.rateLimit).not.toHaveBeenCalled();
    });

    it('retains the silent honeypot without querying the database', async () => {
        const response = await POST(context({ name: 'Bot', email: 'bot@example.com',
            message: 'Hello', company: 'spam' }));
        expect(response.status).toBe(200);
        expect(mock.from).not.toHaveBeenCalled();
    });

    it('retains the rate-limit boundary', async () => {
        mock.rateLimit.mockResolvedValue({ success: false });
        const response = await POST(context({ name: 'Test Reader', email: 'reader@example.com', message: 'Hello' }));
        expect(response.status).toBe(429);
        expect(mock.from).not.toHaveBeenCalled();
    });
});
