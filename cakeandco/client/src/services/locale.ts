import { useTranslation } from "react-i18next";
import type { Cake } from "../types";

// Hook for locale-aware cake display
export function useCakeLocale() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return {
    name: (cake: Cake) => (isEn && cake.nameEn) ? cake.nameEn : cake.name,
    description: (cake: Cake) => (isEn && cake.descriptionEn) ? cake.descriptionEn : (cake.description || ""),
    isEn,
  };
}
