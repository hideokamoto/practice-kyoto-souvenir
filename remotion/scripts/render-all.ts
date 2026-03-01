import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const COMPOSITIONS = [
  { id: 'DiscoverPage', output: 'discover-page.mp4' },
  { id: 'SightDetail', output: 'sight-detail.mp4' },
  { id: 'FavoritesManagement', output: 'favorites-management.mp4' },
  { id: 'PlanCreation', output: 'plan-creation.mp4' },
];

async function main() {
  const entryPoint = path.resolve(__dirname, '../index.ts');
  const outputDir = path.resolve(__dirname, '../../out');

  console.log('Remotion プロジェクトをバンドル中...');
  const bundled = await bundle({
    entryPoint,
    publicDir: path.resolve(__dirname, '../../public'),
  });

  console.log(`${COMPOSITIONS.length} 件のコンポジションをレンダリング開始`);

  for (const comp of COMPOSITIONS) {
    console.log(`\n[${comp.id}] レンダリング中...`);

    const composition = await selectComposition({
      serveUrl: bundled,
      id: comp.id,
    });

    const outputLocation = path.join(outputDir, comp.output);

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation,
    });

    console.log(`[${comp.id}] 完了 → ${outputLocation}`);
  }

  console.log('\n全コンポジションのレンダリングが完了しました！');
}

main().catch((err) => {
  console.error('レンダリングエラー:', err);
  process.exit(1);
});
