export function formatToTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split('_')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
