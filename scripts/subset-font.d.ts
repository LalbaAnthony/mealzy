declare module 'subset-font' {
  export interface SubsetFontOptions {
    targetFormat?: 'woff' | 'woff2' | 'truetype' | 'sfnt';
    preserveNameIds?: readonly number[];
    variationAxes?: Readonly<Record<string, unknown>>;
  }

  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: SubsetFontOptions,
  ): Promise<Buffer>;
}
