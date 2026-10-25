/** Web メルカトルのタイル座標（小数）。整数部がタイル番号、小数部 × 256 がタイル内のピクセル位置。 */
export function tilePosition(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((lon + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  };
}

export const GSI_PHOTO_URL = (z: number, x: number, y: number) =>
  `https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/${z}/${x}/${y}.jpg`;
export const GSI_TILES_PAGE = 'https://maps.gsi.go.jp/development/ichiran.html';
