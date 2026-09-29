export type TauriInvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<any>;

export interface NativeBoundsDto {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativeMonitorDto {
  id: string;
  name: string;
  bounds: NativeBoundsDto;
  workArea: NativeBoundsDto;
  scaleFactor: number;
  primary: boolean;
}
