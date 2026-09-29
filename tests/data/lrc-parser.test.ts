import { describe, expect, it } from 'vitest';
import { parseLrc } from '../../src/data/lyrics/lrc-parser.js';

describe('LRC Synchronized Lyrics Parser', () => {
  it('parses standard [mm:ss.xx] timestamped lines', () => {
    const lrc = `
[00:05.20]Is this the real life?
[00:08.50]Is this just fantasy?
[00:12.75]Caught in a landslide
`;
    const lines = parseLrc(lrc);
    expect(lines).toHaveLength(3);

    expect(lines[0]).toEqual({
      timeMs: 5200,
      text: 'Is this the real life?',
    });
    expect(lines[1]).toEqual({
      timeMs: 8500,
      text: 'Is this just fantasy?',
    });
    expect(lines[2]).toEqual({
      timeMs: 12750,
      text: 'Caught in a landslide',
    });
  });

  it('parses 3-digit millisecond timestamps [mm:ss.xxx]', () => {
    const lrc = `[01:14.250]No escape from reality`;
    const lines = parseLrc(lrc);
    expect(lines).toHaveLength(1);
    expect(lines[0].timeMs).toBe(74250); // 60s + 14.25s = 74.25s = 74250ms
    expect(lines[0].text).toBe('No escape from reality');
  });

  it('handles multiple timestamps on the same line', () => {
    const lrc = `[00:10.00][00:25.00]Chorus line repeated`;
    const lines = parseLrc(lrc);
    expect(lines).toHaveLength(2);
    expect(lines[0].timeMs).toBe(10000);
    expect(lines[0].text).toBe('Chorus line repeated');
    expect(lines[1].timeMs).toBe(25000);
    expect(lines[1].text).toBe('Chorus line repeated');
  });

  it('filters out metadata headers like [ti:...], [ar:...]', () => {
    const lrc = `
[ti:Bohemian Rhapsody]
[ar:Queen]
[al:A Night at the Opera]
[by:Someone]
[00:01.00]Open your eyes
`;
    const lines = parseLrc(lrc);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      timeMs: 1000,
      text: 'Open your eyes',
    });
  });

  it('sorts lines chronologically if they appear out of order', () => {
    const lrc = `
[00:20.00]Third line
[00:05.00]First line
[00:10.00]Second line
`;
    const lines = parseLrc(lrc);
    expect(lines).toHaveLength(3);
    expect(lines[0].timeMs).toBe(5000);
    expect(lines[1].timeMs).toBe(10000);
    expect(lines[2].timeMs).toBe(20000);
  });

  it('handles empty or malformed strings gracefully', () => {
    expect(parseLrc('')).toEqual([]);
    expect(parseLrc('Just plain text without timestamps')).toEqual([]);
    expect(parseLrc('[invalid:timestamp] text')).toEqual([]);
  });
});
