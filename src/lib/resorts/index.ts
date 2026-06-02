import type { Resort } from './types';
import resortsData from './resorts.json';

const resorts: Resort[] = resortsData as Resort[];

export function getResorts(): Resort[] {
  return resorts;
}

export function getResortById(id: number): Resort | null {
  return resorts.find((r) => r.id === id) ?? null;
}
