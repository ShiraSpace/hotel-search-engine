export const SIMULATOR_ENDPOINT =
  'https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator';

export function groupSizeRange(min: number): number[] {
  const result: number[] = [];
  for (let i = min; i <= 10; i++) {
    result.push(i);
  }
  return result;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}
