declare module "rwanda" {
  export function Provinces(): string[] | undefined;
  export function Districts(input?: { provinces?: string | string[] }): string[] | undefined;
  export function Sectors(input?: { province?: string; district?: string }): string[] | undefined;
  export function Cells(input?: { province?: string; district?: string; sector?: string }): string[] | undefined;
  export function Villages(input?: { province?: string; district?: string; sector?: string; cell?: string }): string[] | undefined;
}
