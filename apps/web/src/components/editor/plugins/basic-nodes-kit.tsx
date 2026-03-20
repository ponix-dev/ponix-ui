'use client';

import { BasicBlocksKit } from './basic-blocks-kit';
import { BasicMarksKit } from './basic-marks-kit';
import { AutoformatKit } from './autoformat-kit';
import { ListKit } from './list-kit';
import { CodeBlockKit } from './code-block-kit';

export const BasicNodesKit = [
  ...BasicBlocksKit,
  ...BasicMarksKit,
  ...ListKit,
  ...CodeBlockKit,
  ...AutoformatKit,
];
