import type { Metadata } from "next";

import { SystemFlow } from "./system-flow";

export const metadata: Metadata = {
  title: "Sistem nasıl çalışır",
  description:
    "Sözleşmeden ödemeye kadar paranın izlediği yolun adım adım şeması: escrow durum makinesi, komisyon ve stopaj dağılımı, kayıt defteri.",
};

export default function HowItWorksPage() {
  return <SystemFlow />;
}
