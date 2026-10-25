import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, decodeText } from './lib/csv.mjs';

test('parseCsv: 引用符・引用符内の改行とカンマ・二重引用符を扱う', () => {
  const text = 'a,"b,1","c\n\nd","e""f"\r\n1,,3,4\n';
  assert.deepEqual(parseCsv(text), [
    ['a', 'b,1', 'c\n\nd', 'e"f'],
    ['1', '', '3', '4'],
  ]);
});

test('parseCsv: 末尾に改行が無くても最後の行を返す', () => {
  assert.deepEqual(parseCsv('x,y'), [['x', 'y']]);
});

test('parseCsv: 先頭の BOM を落とす', () => {
  assert.deepEqual(parseCsv('﻿id,name\n1,a'), [
    ['id', 'name'],
    ['1', 'a'],
  ]);
});

test('decodeText: UTF-8 として不正なら Shift_JIS で読む', () => {
  const sjis = Buffer.from([0x8b, 0x9e, 0x93, 0x73]); // 「京都」の Shift_JIS
  assert.equal(decodeText(sjis), '京都');
  assert.equal(decodeText(Buffer.from('京都', 'utf8')), '京都');
});
