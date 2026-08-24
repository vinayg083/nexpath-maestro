import type { IconName } from "@/lib/icons/LucideIcon";

// Lucide has renamed some icons, so the intuitive icon_key an admin types no
// longer matches the current export (e.g. Lucide renamed Home -> House). Map the
// friendly key to the real export here so these keep rendering instead of
// silently falling back to the generic Image icon.
const ICON_ALIASES: Record<string, IconName> = {
  home: "House",
  house: "House",
};

export function resolveCategoryIcon(iconKey: string | null | undefined): IconName | undefined {
  if (!iconKey) {
    return undefined;
  }

  const alias = ICON_ALIASES[iconKey.toLowerCase()];
  if (alias) {
    return alias;
  }

  if (/^[A-Z][A-Za-z0-9]*$/.test(iconKey)) {
    return iconKey as IconName;
  }

  const pascalCase = iconKey
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  return pascalCase ? (pascalCase as IconName) : undefined;
}
