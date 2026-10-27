import { APP_URL } from './app-info';

/** Netlify の本番ドメイン。games.hidetaka.dev の CloudFront はここからページを取ってくる。 */
export const NETLIFY_HOST = 'kyoto-app.netlify.app';

/**
 * Netlify の本番ドメインに直接来たときの移動先（正式な URL。画面とクエリは引き継ぐ）。移さないときは null。
 * games.hidetaka.dev 経由ならブラウザのホスト名は games.hidetaka.dev なので、ループしない。
 * デプロイプレビュー（deploy-preview-N--kyoto-app.netlify.app）や手元は移さない。
 */
export function canonicalRedirect(loc: {
  hostname: string;
  search: string;
  hash: string;
}): string | null {
  return loc.hostname === NETLIFY_HOST ? `${APP_URL}${loc.search}${loc.hash}` : null;
}
