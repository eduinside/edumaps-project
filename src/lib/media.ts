export const MEDIA_BASE_URL = "https://dgedu.link/media/edumaps";

export function mediaUrl(filename: string): string {
  return `${MEDIA_BASE_URL}/${filename}`;
}
