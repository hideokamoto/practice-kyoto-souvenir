import { APP_URL } from './app-info';
import { canonicalRedirect } from './canonical';

const at = (href: string) => {
  const u = new URL(href);
  return { hostname: u.hostname, search: u.search, hash: u.hash };
};

describe('canonicalRedirect（Netlify の本番ドメインに直接来たら games.hidetaka.dev へ移す）', () => {
  it('Netlify の本番ドメインなら、正式な URL を返す', () => {
    expect(canonicalRedirect(at('https://kyoto-app.netlify.app/'))).toBe(APP_URL);
  });

  it('画面（ハッシュ）とクエリはそのまま引き継ぐ', () => {
    expect(canonicalRedirect(at('https://kyoto-app.netlify.app/?ref=x#/credits'))).toBe(
      `${APP_URL}?ref=x#/credits`,
    );
  });

  it.each([
    'https://games.hidetaka.dev/kyoto-ikezu-quiz/',
    'https://deploy-preview-16--kyoto-app.netlify.app/',
    'https://main--kyoto-app.netlify.app/',
    'http://localhost:4200/',
    'http://127.0.0.1:4173/',
  ])('%s では移さない（正式な URL・デプロイプレビュー・手元）', (href) => {
    expect(canonicalRedirect(at(href))).toBeNull();
  });
});
