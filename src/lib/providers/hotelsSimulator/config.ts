export const SIMULATOR_ENDPOINT =
  'https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator';

export const MAX_GROUP_SIZE = 10;
export const PROVIDER_ID = 'hotels-simulator';
export const MAIN_IMAGE_SENTINEL = 'True';

export function groupSizeRange(min: number): number[] {
  const result: number[] = [];
  for (let i = min; i <= MAX_GROUP_SIZE; i++) {
    result.push(i);
  }
  return result;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}
