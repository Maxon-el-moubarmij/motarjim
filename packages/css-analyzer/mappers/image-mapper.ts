export interface ImageSource {
  url: string;
  isRemote: boolean;
  isAsset: boolean;
  alt?: string;
}

export function resolveImageSource(src: string | undefined): ImageSource | null {
  if (!src) return null;

  if (src.startsWith('http://') || src.startsWith('https://')) {
    return { url: src, isRemote: true, isAsset: false };
  }

  if (src.startsWith('data:')) {
    return { url: src, isRemote: true, isAsset: false };
  }

  if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
    return { url: src, isRemote: false, isAsset: true };
  }

  return { url: src, isRemote: false, isAsset: true };
}

export function imageForFlutter(source: ImageSource): string {
  if (source.isRemote) {
    return `Image.network("${escapeString(source.url)}")`;
  }
  return `Image.asset("${escapeString(source.url)}")`;
}

export function imageForSwiftUI(source: ImageSource): string {
  if (source.isRemote) {
    return `AsyncImage(url: URL(string: "${escapeString(source.url)}")!)`;
  }
  return `Image("${escapeString(source.url)}")`;
}

export function imageForCompose(source: ImageSource): string {
  if (source.isRemote) {
    return `AsyncImage(model = "${escapeString(source.url)}", contentDescription = null)`;
  }
  return `painterResource(id = "${escapeString(source.url)}")`;
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\$/g, '\\$');
}
