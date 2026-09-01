import { z } from "zod";

import type { Enums } from "@/lib/supabase/database.types";

export type ProjectCategory = Enums<"project_category">;

export const PROJECT_CATEGORIES = [
  "SOFTWARE",
  "DESIGN",
  "VIDEO",
  "CONTENT",
  "MARKETING",
  "OTHER",
] as const satisfies readonly ProjectCategory[];

/**
 * What kind of work a contract covers, and what "delivery" means for it.
 *
 * The delivery table stores one URL. That is deliberate -- a staging site, a
 * Figma file and a Drive folder are all URLs, so the schema does not need to
 * fork per category. What does need to change is what the freelancer is
 * ASKED for: prompting a video editor for a "staging address" is the kind of
 * detail that tells a user the product was not built for them.
 */
export const PROJECT_CATEGORY_INFO: Record<
  ProjectCategory,
  {
    label: string;
    tagline: string;
    /** Label on the required delivery URL field. */
    deliveryLabel: string;
    deliveryHint: string;
    deliveryPlaceholder: string;
    /** Label on the optional second link. Null hides the field entirely. */
    secondaryLabel: string | null;
    secondaryPlaceholder: string;
    /** Example criteria, shown as ghost text so the field is not a blank page. */
    criterionPlaceholder: string;
  }
> = {
  SOFTWARE: {
    label: "Yazılım & Web",
    tagline: "Web, mobil veya backend geliştirme",
    deliveryLabel: "Staging adresi",
    deliveryHint: "Kabul kriterleri bu adres üzerinden doğrulanır.",
    deliveryPlaceholder: "https://staging.ornek.com",
    secondaryLabel: "PR / repo linki",
    secondaryPlaceholder: "https://github.com/kullanici/repo/pull/12",
    criterionPlaceholder:
      "Örn: Ana sayfa tüm cihazlarda düzgün görünmeli ve 3 saniye içinde yüklenmeli",
  },
  DESIGN: {
    label: "Grafik & UI Tasarım",
    tagline: "Logo, kurumsal kimlik, arayüz tasarımı",
    deliveryLabel: "Tasarım dosyası linki",
    deliveryHint: "Figma, Drive veya Behance linki. Görüntüleme izni açık olmalı.",
    deliveryPlaceholder: "https://figma.com/file/...",
    secondaryLabel: "Kaynak dosya linki",
    secondaryPlaceholder: "https://drive.google.com/...",
    criterionPlaceholder:
      "Örn: Logo 3 farklı varyantta (yatay, dikey, ikon) ve SVG formatında teslim edilmeli",
  },
  VIDEO: {
    label: "Video & Motion",
    tagline: "Video kurgu, animasyon, motion grafik",
    deliveryLabel: "Video linki",
    deliveryHint: "Drive, Frame.io veya Vimeo linki. İndirme izni açık olmalı.",
    deliveryPlaceholder: "https://drive.google.com/...",
    secondaryLabel: "Proje dosyası linki",
    secondaryPlaceholder: "https://drive.google.com/...",
    criterionPlaceholder:
      "Örn: 60 saniyelik final kurgu 1080p, renk düzeltmesi yapılmış ve altyazılı olmalı",
  },
  CONTENT: {
    label: "İçerik & Metin",
    tagline: "Metin yazarlığı, çeviri, SEO içeriği",
    deliveryLabel: "İçerik linki",
    deliveryHint: "Google Docs veya Notion linki. Yorum izni açık olmalı.",
    deliveryPlaceholder: "https://docs.google.com/...",
    secondaryLabel: null,
    secondaryPlaceholder: "",
    criterionPlaceholder:
      "Örn: 5 blog yazısı, her biri en az 800 kelime ve belirlenen anahtar kelimeleri içermeli",
  },
  MARKETING: {
    label: "Pazarlama & Sosyal Medya",
    tagline: "Reklam yönetimi, sosyal medya, SEO",
    deliveryLabel: "Rapor / panel linki",
    deliveryHint: "Rapor dokümanı veya paylaşılan panel linki.",
    deliveryPlaceholder: "https://docs.google.com/...",
    secondaryLabel: "Kampanya paneli",
    secondaryPlaceholder: "https://ads.google.com/...",
    criterionPlaceholder:
      "Örn: Ay boyunca haftada 4 gönderi paylaşılmalı ve aylık erişim raporu sunulmalı",
  },
  OTHER: {
    label: "Diğer",
    tagline: "Yukarıdakilere girmeyen işler",
    deliveryLabel: "Teslim linki",
    deliveryHint: "İşin teslim edildiği adres.",
    deliveryPlaceholder: "https://...",
    secondaryLabel: "Ek link",
    secondaryPlaceholder: "https://...",
    criterionPlaceholder:
      "Örn: Teslim edilen işte neye bakılarak 'tamam' denileceğini somut yaz",
  },
};

export const projectCategorySchema = z.enum(PROJECT_CATEGORIES);

export const projectCategoryLabel = (c: ProjectCategory): string =>
  PROJECT_CATEGORY_INFO[c].label;
