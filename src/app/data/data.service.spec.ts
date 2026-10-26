import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';

describe('DataService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('data/<名前>.json を読み、同じデータは 1 回しか取りに行かない', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async (url) => new Response(JSON.stringify({ meta: [], items: [String(url)] })),
      );
    const svc = TestBed.inject(DataService);
    const a = await svc.load(['omiyage', 'kakei']);
    const b = await svc.load(['omiyage']);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls.map((c) => String(c[0])).sort()).toEqual([
      'data/kakei.json',
      'data/omiyage.json',
    ]);
    expect(a.omiyage).toBe(b.omiyage);
  });

  it('読み込みに失敗したら例外にし、次は取り直す', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('x', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ meta: [], items: [] })));
    const svc = TestBed.inject(DataService);
    await expect(svc.load(['meisho'])).rejects.toThrow(/meisho/);
    await expect(svc.load(['meisho'])).resolves.toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
