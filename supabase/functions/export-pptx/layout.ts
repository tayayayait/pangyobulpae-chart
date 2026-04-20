// Social card template: 1440x1800 px (4:5), rendered onto an 8x10 inch PPT layout.
export const TEMPLATE_W_PX = 1440;
export const TEMPLATE_H_PX = 1800;
export const SLIDE_W_IN = 8;
export const SLIDE_H_IN = 10;

const PX_TO_INCH = SLIDE_W_IN / TEMPLATE_W_PX;
const PX_TO_POINT = PX_TO_INCH * 72;

export function pxToInches(value: number): number {
  return value * PX_TO_INCH;
}

export function pxToPoints(value: number): number {
  return Number((value * PX_TO_POINT).toFixed(2));
}