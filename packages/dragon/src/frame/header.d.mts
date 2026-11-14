export interface HeaderColors { surface?: string; background?: string; foreground?: string; muted?: string; border?: string; accent?: string; hover?: string }
export const HEADER_CSS: string;
export function createFigureHeader(document: Document, options?: { title?: string; colors?: HeaderColors; mark?: { href: string; label?: string }; label?: string; styles?: boolean; nonce?: string }): {element: HTMLDivElement; title: HTMLParagraphElement; actions: HTMLDivElement; settings: HTMLDivElement; setColors(colors: HeaderColors): void};
