import { describe, it, expect } from 'vitest';
import { buildSystemContext } from './context';

describe('buildSystemContext', () => {
    it('should generate English context by default', () => {
        const context = buildSystemContext('en');
        expect(context).toContain('You are an AI assistant');
        expect(context).toContain('Respond in English');
        expect(context).toContain('Name: Anton Meier Ebsen Jørgensen');
    });

    it('should generate Danish context when requested', () => {
        const context = buildSystemContext('da');
        expect(context).toContain('Respond in Danish');
        // Check for Danish timeline content if available in your JSON
        // e.g., using a known Danish title from timeline.json
    });

    it('should include key sections', () => {
        const context = buildSystemContext();
        expect(context).toContain('CORE INFO');
        expect(context).toContain('EXPERIENCE');
        expect(context).toContain('PROJECTS');
        expect(context).toContain('COMMON Q&A');
    });

    it('should include bio from about.json', () => {
        const context = buildSystemContext();
        // Check for specific bio strings found in about.json
        // e.g. expect(context).toContain("cand.oecon"); 
    });
});
