import type { CxChunk } from './RingCX/RingCX.interface';

export function loadRingCXChunk(): Promise<CxChunk> {
  return import(
    /* webpackChunkName: "ringcx" */
    '../../ringcx'
  ) as Promise<CxChunk>;
}
