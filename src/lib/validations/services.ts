import { z } from "zod";

import { PROJECT_CATEGORY_INFO, type ProjectCategory } from "@/lib/validations/project-category";

/**
 * What a freelancer offers, grouped under the same six categories a project
 * is created in. Picking from a catalog instead of typing free text means a
 * client filtering for "video editing" finds everyone who does it, not just
 * whoever happened to type that exact phrase into "Uzmanlıklar".
 *
 * Values are stable strings, not translated labels -- the label can be
 * reworded without invalidating every profile that picked it.
 */
export const SERVICE_CATALOG: Record<
  ProjectCategory,
  { label: string; items: { value: string; label: string }[] }
> = {
  SOFTWARE: {
    label: PROJECT_CATEGORY_INFO.SOFTWARE.label,
    items: [
      { value: "frontend_gelistirme", label: "Frontend Geliştirme" },
      { value: "backend_gelistirme", label: "Backend Geliştirme" },
      { value: "fullstack_gelistirme", label: "Fullstack Geliştirme" },
      { value: "mobil_uygulama", label: "Mobil Uygulama Geliştirme" },
      { value: "web_sitesi_kurulumu", label: "Website Kurulumu" },
      { value: "e_ticaret_kurulumu", label: "E-ticaret Sitesi Kurulumu" },
      { value: "cms_kurulumu", label: "CMS Kurulumu" },
      { value: "api_gelistirme", label: "API Geliştirme" },
      { value: "veritabani", label: "Veritabanı Kurulumu" },
      { value: "server_kurulumu", label: "Server Kurulumu" },
      { value: "domain_hosting", label: "Domain & Hosting" },
      { value: "qa_test", label: "QA Test" },
      { value: "bakim_teknik_destek", label: "Web Sitesi Bakım ve Teknik Destek" },
      { value: "yapay_zeka_entegrasyonu", label: "Yapay Zeka API Entegrasyonu" },
    ],
  },
  DESIGN: {
    label: PROJECT_CATEGORY_INFO.DESIGN.label,
    items: [
      { value: "logo_tasarim", label: "Logo Tasarımı" },
      { value: "kurumsal_kimlik", label: "Kurumsal Kimlik" },
      { value: "ui_tasarim", label: "UI Tasarımı" },
      { value: "ux_tasarim", label: "UX Araştırma ve Tasarım" },
      { value: "sosyal_medya_gorseli", label: "Sosyal Medya Görselleri" },
      { value: "sunum_tasarimi", label: "Sunum Tasarımı" },
      { value: "ambalaj_tasarimi", label: "Ambalaj Tasarımı" },
    ],
  },
  VIDEO: {
    label: PROJECT_CATEGORY_INFO.VIDEO.label,
    items: [
      { value: "video_kurgu", label: "Video Kurgu" },
      { value: "motion_grafik", label: "Motion Grafik" },
      { value: "renk_duzeltme", label: "Renk Düzeltme" },
      { value: "seslendirme_dublaj", label: "Seslendirme ve Dublaj" },
      { value: "cekim", label: "Video Çekimi" },
      { value: "3d_animasyon", label: "3D Animasyon" },
    ],
  },
  CONTENT: {
    label: PROJECT_CATEGORY_INFO.CONTENT.label,
    items: [
      { value: "metin_yazarligi", label: "Metin Yazarlığı" },
      { value: "blog_icerigi", label: "Blog İçeriği" },
      { value: "ceviri", label: "Çeviri" },
      { value: "seo_icerik", label: "SEO İçeriği" },
      { value: "teknik_dokumantasyon", label: "Teknik Dokümantasyon" },
    ],
  },
  MARKETING: {
    label: PROJECT_CATEGORY_INFO.MARKETING.label,
    items: [
      { value: "reklam_yonetimi", label: "Reklam Yönetimi" },
      { value: "sosyal_medya_yonetimi", label: "Sosyal Medya Yönetimi" },
      { value: "seo", label: "SEO" },
      { value: "eposta_pazarlama", label: "E-posta Pazarlama" },
      { value: "marka_stratejisi", label: "Marka Stratejisi" },
    ],
  },
  OTHER: {
    label: PROJECT_CATEGORY_INFO.OTHER.label,
    items: [
      { value: "proje_yonetimi", label: "Proje Yönetimi" },
      { value: "is_danismanligi", label: "İş Danışmanlığı" },
      { value: "veri_girisi", label: "Veri Girişi" },
    ],
  },
};

const ALL_SERVICE_VALUES = new Set(
  Object.values(SERVICE_CATALOG).flatMap((group) => group.items.map((item) => item.value)),
);

export const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(SERVICE_CATALOG).flatMap((group) => group.items.map((item) => [item.value, item.label])),
);

/**
 * Comma-separated in the form (same convention as skills), an array in the
 * column. Unknown values are dropped rather than rejected -- a stale value
 * from a catalog that has since dropped an item should not lock a form.
 */
export const servicesSchema = z
  .string()
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter((s) => ALL_SERVICE_VALUES.has(s)),
  );
