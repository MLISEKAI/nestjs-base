import { ClsServiceManager } from 'nestjs-cls';
import { generateMemorable } from 'src/utils';

export function currentTraceId(): string {
  return ClsServiceManager.getClsService()?.get('traceId') || generateMemorable();
}

export function setCurrentTraceId(traceId?: string): void {
  ClsServiceManager.getClsService()?.set('traceId', traceId || generateMemorable());
}
