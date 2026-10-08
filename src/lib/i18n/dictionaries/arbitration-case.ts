import type { Locale } from "@/lib/i18n/config";

export interface PartyInfo {
  role: string;
  name: string;
  title: string;
  representative: string;
  avatar: string;
  claimSummary: string;
  demands: string;
}

export interface StoryChapter {
  index: string;
  day: string;
  title: string;
  date: string;
  summary: string;
  detail: string;
  badge: string;
  badgeColor: "emerald" | "amber" | "indigo" | "rose" | "cyan";
  technicalArtifact: {
    label: string;
    value: string;
  };
}

export interface CourtEvidenceItem {
  id: string;
  code: string;
  title: string;
  category: string;
  status: "VERIFIED" | "LEGAL_PROOF";
  legalCitation: string;
  summary: string;
  technicalData: Record<string, string>;
}

export interface CourtObjection {
  id: string;
  objectionTitle: string;
  employerArgument: string;
  courtRuling: "REJECTED" | "TIME_BARRED" | "UNSUBSTANTIATED";
  rulingTitle: string;
  rulingReasoning: string;
  legalBasis: string;
  evidenceRef: string;
}

export interface ArbitrationCaseCopy {
  metaTitle: string;
  metaDescription: string;
  courtHeader: {
    institution: string;
    chamber: string;
    caseNo: string;
    docketRef: string;
    sessionBadge: string;
    amount: string;
    amountLabel: string;
    decisionDate: string;
    statusBadge: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    storyCta: string;
    trialCta: string;
  };
  parties: {
    title: string;
    subtitle: string;
    claimant: PartyInfo;
    respondent: PartyInfo;
    tribunal: {
      name: string;
      title: string;
      role: string;
      authority: string;
    };
  };
  story: {
    title: string;
    subtitle: string;
    chapters: StoryChapter[];
  };
  courtroom: {
    title: string;
    subtitle: string;
    gavelPrompt: string;
    gavelStrikeLabel: string;
    gavelAudioNotice: string;
    stenographerTitle: string;
    stenographerLive: string;
    tabs: {
      phase1: string;
      phase2: string;
      phase3: string;
      phase4: string;
    };
    phase1: {
      title: string;
      description: string;
      claimantHeader: string;
      respondentHeader: string;
      contractDigestTitle: string;
      contractDigestItems: { label: string; value: string }[];
    };
    phase2: {
      title: string;
      description: string;
      probeTitle: string;
      probeStatusReady: string;
      probeStatusRunning: string;
      probeStatusSuccess: string;
      runProbeButton: string;
      evidences: CourtEvidenceItem[];
    };
    phase3: {
      title: string;
      description: string;
      selectPrompt: string;
      objections: CourtObjection[];
    };
    phase4: {
      title: string;
      description: string;
      decreeHeader: string;
      decreeSubheader: string;
      decreeNumber: string;
      verdictRulingTitle: string;
      verdictItems: string[];
      judicialReasoningTitle: string;
      judicialReasoning: string;
      signatureTitle: string;
      signatureClerk: string;
      signaturePresident: string;
      sha256Seal: string;
      downloadPdfCta: string;
      publicVerifyCta: string;
      qrNotice: string;
    };
  };
  bottomCta: {
    title: string;
    description: string;
    button: string;
    secondary: string;
  };
}

export const ARBITRATION_CASE_COPY: Record<Locale, ArbitrationCaseCopy> = {
  tr: {
    metaTitle: "85.000 TL Kuyumculuk & MASAK Tahkim Davası — Dijital Mahkeme Duruşması",
    metaDescription:
      "Canlı altın kurları ve MASAK uyumluluk projesinde keyfi fesih girişiminin TBK m. 474/477 ve HMK m. 193 ile nasıl çürütüldüğünü gerçek bir dijital mahkeme duruşması gibi deneyimleyin.",
    courtHeader: {
      institution: "T.C. BAĞIMSIZ DİJİTAL TAHKİM & BİLİŞİM HAKEMLİĞİ",
      chamber: "3. Ticaret ve Bilişim Uyuşmazlıkları Hakem Heyeti",
      caseNo: "Esas No: 2026/85000-KUYUMCU",
      docketRef: "LCX-2026-85000-KUYUMCU",
      sessionBadge: "DURUŞMA TUTANAĞI · KESİN HÜKÜM",
      amount: "85.000 ₺",
      amountLabel: "Uyuşmazlık ve Hüküm Bedeli",
      decisionDate: "06 Ekim 2026",
      statusBadge: "HÜKÜM KESİNLEŞTİ (HMK m. 193)",
    },
    hero: {
      badge: "Kurucunun Gerçek Vakası · Samed Çoban'ın Başından Geçen Uyuşmazlık",
      title: "85.000 TL Kapalıçarşı Kuyumculuk & MASAK Projesi: Haksız Feshin Duruşması",
      subtitle:
        "Lancerix kurucusu Samed Çoban'ın bizzat yaşadığı ve bu platformu inşa etmesine yol açan gerçek vaka: 22 gün boyunca canlı WebSocket altın kur motoru ve MASAK AML altyapısı geliştirilip eksiksiz teslim edildi. İşverenin 'altın fiyatı dalgalandı, tasarımı beğenmedik' diyerek faturayı ödememe girişimi, TBK m. 477 zımni kabul ve HMK m. 193 delil kalkanıyla nasıl boşa çıkarıldı? Adım adım duruşmayı yönetin.",
      storyCta: "Kurucunun Hikayesini Oku",
      trialCta: "Duruşmayı Başlat (Tokmak Vur)",
    },
    parties: {
      title: "Duruşma Tarafları ve İddiaları",
      subtitle: "6100 sayılı Hukuk Muhakemeleri Kanunu ve Türk Borçlar Kanunu kapsamında taraf beyanları",
      claimant: {
        role: "İtiraz Eden (İşveren)",
        name: "Altın & Mücevherat E-Ticaret A.Ş.",
        title: "Kapalıçarşı Toptan & Perakende Altın Ticareti",
        representative: "Hakan B. (Genel Müdür Yardımcısı)",
        avatar: "🏛️",
        claimSummary:
          "\"Yazılım teslim edildi ama CEO'muzun içine sinmedi. Tasarım kurumsal kimliğimize tam uymadı ve fiyatlar sanki 1-2 saniye geç güncelleniyor gibi geldi. Faturayı ödemiyoruz, sözleşmeyi tek taraflı feshedip peşinatı geri istiyoruz.\"",
        demands: "Proje iptali, hakedişin reddi, peşinat iadesi.",
      },
      respondent: {
        role: "Hakediş Sahibi (Yazılımcı / Kurucu)",
        name: "Samed Çoban (Lancerix Kurucusu & Kıdemli Sistem Mimarı)",
        title: "Kıdemli Fullstack & FinTech Entegrasyon Geliştiricisi",
        representative: "Kendisi Asil Olarak (Lancerix Protokolü Korumasında)",
        avatar: "💻",
        claimSummary:
          "\"Sözleşmede tanımlı 4 teknik kriterin tamamı eksiksiz çalışır halde teslim edildi. Staging ortamında WebSocket gecikmesi 138ms olarak ölçüldü (SLA <250ms sağlandı). Teslimatın üzerinden 7 gün 2 saat geçti; işveren TBK m. 474 kapsamında hiçbir somut ayıp ihbarında bulunmadı. TBK m. 477 gereği eser zımnen kabul edilmiştir.\"",
        demands: "85.000 TL hakedişin derhal serbest bırakılması, delil tespiti.",
      },
      tribunal: {
        name: "Lancerix Bilişim Tahkim Kurulu",
        title: "Kriptografik Adli Bilişim & Hukuk Heyeti",
        role: "Bağımsız Hakem & Bilirkişi",
        authority: "HMK m. 193 Münhasır Delil Sözleşmesi Uyarınca Bağlayıcı",
      },
    },
    story: {
      title: "Gerçek Bir Freelance Krizinin Anatomisi",
      subtitle: "Sözleşmeden canlı teste, 7 günlük sessizlik tuzağından mahkeme salonuna uzanan kronoloji",
      chapters: [
        {
          index: "01",
          day: "1. Gün",
          title: "Sözleşme & Koda Bağlanan Şartname",
          date: "14 Eylül 2026 · 09:00",
          summary: "Subjektif vaatler yerine matematiksel kabul kriterleri belirlendi.",
          detail:
            "Kapalıçarşı'da faaliyet gösteren kuyumcu firması, altın ve döviz fiyatlarını anlık eşitleyen ve MASAK AML doğrulaması yapan bir API motoru için yazılımcıyla anlaştı. Lancerix üzerinde 85.000 TL bedelli sözleşme oluşturuldu; 4 kesin kriter koda bağlandı ve iki tarafça SHA-256 dijital imzayla mühürlendi.",
          badge: "HMK m. 193 İmzalandı",
          badgeColor: "emerald",
          technicalArtifact: {
            label: "Sözleşme SHA-256 Mührü",
            value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          },
        },
        {
          index: "02",
          day: "22. Gün",
          title: "Geliştirme & ProofGuard Canlı Teslimatı",
          date: "06 Ekim 2026 · 14:30",
          summary: "Sistem staging ortamına yüklendi ve ProofGuard nöbetçisi devreye girdi.",
          detail:
            "Yazılımcı 22 gün boyunca 4 farklı piyasa kaynağından WebSocket beslemesini birleştiren, sepet kilit mekanizması ve MASAK VKN doğrulaması sunan motoru staging ortamına deploy etti. ProofGuard sistemi saniye saniye test etti: HTTP 200 OK, TLS 1.3 ve 138 ms ortalama gecikme kaydedildi.",
          badge: "ProofGuard Canlıda",
          badgeColor: "indigo",
          technicalArtifact: {
            label: "Canlı Teslimat Parmak İzi",
            value: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
          },
        },
        {
          index: "03",
          day: "23-29. Gün",
          title: "Sessizlik Tuzağı & 7 Günlük Muayene Sayacı",
          date: "06 - 13 Ekim 2026",
          summary: "İşveren sistemi sözlü onayladı ancak faturayı ödememek için sessizliğe gömüldü.",
          detail:
            "Yazılımcı canlı demoyu işverene iletti. Şirket yöneticisi sözlü olarak 'Eline sağlık, bakıyoruz' dedi. Ancak aradan geçen 7 gün boyunca ne bir hata kaydı açtı ne de somut bir eksik bildirdi. Amacı süreci soğutup faturadan kaçınmaktı. Fakat Lancerix TBK m. 477 sayacını arka planda işletiyordu.",
          badge: "TBK m. 474 Muayene Süresi",
          badgeColor: "amber",
          technicalArtifact: {
            label: "Yasal Muayene Süresi",
            value: "7 Gün 00 Saat Doldu · Sıfır Hata Logu Bildirildi",
          },
        },
        {
          index: "04",
          day: "30. Gün",
          title: "Keyfi Fesih Girişimi: 'İçimize Sinmedi!'",
          date: "14 Ekim 2026 · 10:15",
          summary: "Ödeme günü gelince işveren soyut bahanelerle sözleşmeyi feshetmeye kalkıştı.",
          detail:
            "Yasal süre bittikten sonra işveren e-posta attı: 'Yönetim kurulumuz tasarımı beğenmedi, altın kurları da gözümüze yavaş geldi, projeyi iptal ettik paramızı iade edin.' Klasik piyasada bu rest yazılımcının aylarca mahkeme kapısında sürünmesi demekti. Lancerix'te ise tam tersi oldu.",
          badge: "Soyut İtiraz",
          badgeColor: "rose",
          technicalArtifact: {
            label: "İşveren Gerekçesi",
            value: "\"Beğenmedim, içime sinmedi\" (Somut teknik delil sunulmadı)",
          },
        },
        {
          index: "05",
          day: "Hüküm Günü",
          title: "Dijital Mahkeme Hükmü: Haksız Fesih Çürütüldü",
          date: "14 Ekim 2026 · 14:00",
          summary: "HMK 193 delil tutanağı ve TBK 477 zımni kabulüyle 85.000 TL hükme bağlandı.",
          detail:
            "Lancerix Tahkim Heyeti dosyayı inceledi. İşverenin soyut iddiaları TBK 474 ve 477 gereğince reddedildi. Canlı ProofGuard logları ve SHA-256 zaman damgalı bilirkişi raporu doğrultusunda 85.000 TL hakediş bedelinin yazılımcıya ödenmesine kesin olarak hükmedildi.",
          badge: "HMK 193 Kesin Hüküm",
          badgeColor: "cyan",
          technicalArtifact: {
            label: "Nihai Hüküm Dosyası",
            value: "LCX-2026-85000-KUYUMCU · %100 Yazılımcı Lehine Onay",
          },
        },
      ],
    },
    courtroom: {
      title: "İnteraktif Tahkim Mahkemesi Duruşma Salonu",
      subtitle:
        "Hakim tokmağına vurun, zabıt katibinin loglarını inceleyin, delilleri adli bilişim konsolundan probe edin ve işverenin itirazlarını karara bağlayın.",
      gavelPrompt: "Duruşmayı Başlatmak ve Zabıt Katibini Açmak İçin Tokmağa Vurun",
      gavelStrikeLabel: "HAKİM TOKMAĞINI VUR (DURUŞMAYI AÇ)",
      gavelAudioNotice: "Tokmak sesi Web Audio API ile canlı sentezlenir.",
      stenographerTitle: "Mahkeme Zabıt Katibi Canlı Daktilo Akışı",
      stenographerLive: "CANLI ZABIT TUTULUYOR",
      tabs: {
        phase1: "1. İddianame & Savunma",
        phase2: "2. Adli Bilişim & Deliller",
        phase3: "3. Çapraz Sorgu & İtiraz",
        phase4: "4. Gerekçeli Mahkeme İlamı",
      },
      phase1: {
        title: "Aşama 1: Duruşmanın Açılışı ve Taraf İddiaları",
        description:
          "Hakim heyeti tarafların sözleşme şartnamesini ve karşılıklı beyanlarını zapta geçirdi.",
        claimantHeader: "Davacı / İtiraz Eden İşveren Beyanı:",
        respondentHeader: "Davalı / Hakediş Sahibi Yazılımcı Savunması:",
        contractDigestTitle: "Dava Konusu Sözleşme Özeti (HMK m. 193 Delil Kaydı):",
        contractDigestItems: [
          { label: "Sözleşme Numarası", value: "LCX-2026-85000-KUYUMCU" },
          { label: "Hüküm & Hakediş Bedeli", value: "85.000 TL (Seksenbeş Bin Türk Lirası)" },
          { label: "İşin Niteliği", value: "Altın/Döviz Canlı Fiyatlama & MASAK Uyum Motoru" },
          { label: "İhbar & Muayene Külfeti", value: "TBK m. 474 Uyarınca 7 Günlük İtiraz Penceresi" },
          { label: "Kriptografik İmzalar", value: "Çift Taraflı SHA-256 Islak İmza Hükmünde Mühürlü" },
        ],
      },
      phase2: {
        title: "Aşama 2: Adli Bilişim Masası & Canlı Kanıt İncelemesi",
        description:
          "Mahkeme heyeti, yazılımcının teslim ettiği staging sistemini canlı olarak problar ve adli bilişim kayıtlarını inceler.",
        probeTitle: "ProofGuard Canlı Adli Telemetri Prober'ı",
        probeStatusReady: "Adli probe hazır · Canlı ping testi yapabilirsiniz",
        probeStatusRunning: "Staging host problanıyor... TLS 1.3 ve HTTP 200 doğrulanıyor...",
        probeStatusSuccess: "Adli Doğrulama Tamam: Sistem %100 Erişilebilir ve SLA Sınırında!",
        runProbeButton: "Canlı Sistemi Adli Olarak Probe Et (Ping & TLS Test)",
        evidences: [
          {
            id: "ev1",
            code: "DELİL-A",
            title: "ProofGuard Canlı Uptime & Gecikme Telemetrisi",
            category: "Adli Bilişim Kaydı",
            status: "VERIFIED",
            legalCitation: "HMK m. 193 Münhasır Delil",
            summary:
              "Staging sunucusunun 7 gün boyunca kesintisiz çalıştığı, ortalama yanıt süresinin 138 ms (SLA sınırı <250 ms) olduğu bağımsız sunucu loglarıyla sabittir.",
            technicalData: {
              "HTTP Kodu": "200 OK",
              "Ortalama Latency": "138 ms",
              "Sözleşme SLA": "< 250 ms (Başarılı)",
              "Protokol": "TLS 1.3 / HSTS",
            },
          },
          {
            id: "ev2",
            code: "DELİL-B",
            title: "TBK m. 477 Yasal 7 Günlük Sessizlik Tutanağı",
            category: "Zaman Damgası Kaydı",
            status: "LEGAL_PROOF",
            legalCitation: "TBK m. 477 Zımni Kabul",
            summary:
              "Teslimat tarihi 06.10.2026 saat 14:30. Yasal muayene süresi olan 7 gün (168 saat) boyunca işveren tarafından platforma tek bir teknik ayıp/arıza kaydı düşülmemiştir.",
            technicalData: {
              "Teslim Anı": "2026-10-06 14:30:00",
              "Yasal Son Tarih": "2026-10-13 14:30:00",
              "İtirazsız Geçen Süre": "7 Gün 02 Saat",
              "Hüküm": "Zımni Kabul Gerçekleşti",
            },
          },
          {
            id: "ev3",
            code: "DELİL-C",
            title: "MASAK AML & Sepet Kilitleme Doğrulama Kütüğü",
            category: "Kriptografik İmzalı Log",
            status: "VERIFIED",
            legalCitation: "HMK m. 199 Elektronik Belge",
            summary:
              "10.000 TL üzeri alımlarda kimlik/VKN sorgulama algoritması ve sepetin 180 saniye kurlara karşı kilitlenme fonksiyonu simüle edilmiş ve başarıyla doğrulanmıştır.",
            technicalData: {
              "MASAK Doğrulama": "Aktif & Uyumlu",
              "Sepet Kilidi": "180 Saniye Sabit",
              "SHA-256 Log": "7a41ef689bc...981c",
            },
          },
        ],
      },
      phase3: {
        title: "Aşama 3: Çapraz Sorgu & İtiraz Simülatörü",
        description:
          "İşverenin öne sürdüğü 3 tipik itiraz gerekçesini mahkeme heyetine sunun. Mahkemenin gerekçeli ret kararını canlı izleyin.",
        selectPrompt: "İşverenin Mahkemeye Sunduğu İtirazı Seçin:",
        objections: [
          {
            id: "obj1",
            objectionTitle: "İtiraz 1: \"Tasarım içimize sinmedi, renkleri beğenmedik!\"",
            employerArgument:
              "\"Genel müdürümüz tasarımı kurumsal bulmadı, renk tonları hoşumuza gitmedi. Bu yüzden projeyi tamamen iptal edip paramızı geri istiyoruz.\"",
            courtRuling: "REJECTED",
            rulingTitle: "HAKİM KARARI: İTİRAZ REDDEDİLDİ (OBJECTION OVERRULED)",
            rulingReasoning:
              "Yargıtay Hukuk Genel Kurulu ve TBK m. 474 uyarınca; tarafların teknik şartnamede objektif olarak mutabık kaldığı hususlar dışında ileri sürülen subjektif beğeni ve estetik iddiaları eserin ayıplı olduğunu kanıtlamaz. İşveren sözleşme harici keyfi talepte bulunamaz.",
            legalBasis: "TBK m. 474 / HMK m. 193",
            evidenceRef: "Sözleşme Kriterleri #1-#4",
          },
          {
            id: "obj2",
            objectionTitle: "İtiraz 2: \"Altın kurları 1-2 saniye geç geliyor hissi var!\"",
            employerArgument:
              "\"Sistem çalışıyor gibi ama canlı fiyatların Kapalıçarşı piyasasına göre 1 saniye geç kaldığını hissediyoruz. Performans ayıbı var.\"",
            courtRuling: "UNSUBSTANTIATED",
            rulingTitle: "HAKİM KARARI: DELİLSİZ İDDİA REDDEDİLDİ (UNSUBSTANTIATED)",
            rulingReasoning:
              "ProofGuard adli telemetrisi ve WebSocket ping kütükleri incelenmiştir: Sistemin ortalama gecikmesi 138 ms olup sözleşmede taahhüt edilen 250 ms SLA limitinin oldukça altındadır. İşveren somut sunucu veya ağ gecikme logu sunamamıştır.",
            legalBasis: "HMK m. 190 İspat Külfeti",
            evidenceRef: "DELİL-A ProofGuard Telemetrisi (138 ms)",
          },
          {
            id: "obj3",
            objectionTitle: "İtiraz 3: \"8. gün telefon açıp beğenmediğimizi sözlü bildirdik!\"",
            employerArgument:
              "\"Yazılımcıya teslimattan 8 gün sonra telefon açıp memnun kalmadığımızı ilettik. Dolayısıyla kabul etmedik.\"",
            courtRuling: "TIME_BARRED",
            rulingTitle: "HAKİM KARARI: HAK DÜŞÜRÜCÜ SÜRE AŞIMI (TIME-BARRED)",
            rulingReasoning:
              "TBK m. 474 ve 477 amir hükümleri uyarınca; işveren teslimden sonra eseri gözden geçirmek ve ayıpları derhal (sözleşmede belirlenen 7 gün içinde) yazılı veya platform üzerinden bildirmekle mükelleftir. 7 gün geçtikten sonra yapılan sözlü bildirimler hükümsüzdür; eser kanunen ZIMNEN KABUL EDİLMİŞTİR.",
            legalBasis: "TBK m. 477 Açık ve Örtülü Kabul",
            evidenceRef: "DELİL-B Yasal 7 Günlük Muayene Sayacı",
          },
        ],
      },
      phase4: {
        title: "Aşama 4: Gerekçeli Mahkeme İlamı & Kesin Hüküm",
        description:
          "Mahkeme heyeti tüm delilleri, HMK 193 delil sözleşmesini ve TBK 477 hükümlerini değerlendirerek nihai ilamı vermiştir.",
        decreeHeader: "TÜRK MİLLETİ ADINA",
        decreeSubheader: "DİJİTAL TAHKİM VE BİLİŞİM HAKEM HEYETİ İLAMI",
        decreeNumber: "Karar No: 2026/85000-K · Esas No: 2026/85000-KUYUMCU",
        verdictRulingTitle: "HÜKÜM:",
        verdictItems: [
          "1. Davacı işverenin sözleşmeyi haksız tek taraflı fesih ve bedel iadesi talebinin KESİN OLARAK REDDİNE,",
          "2. Davalı yazılımcının taahhüt ettiği 4 teknik kabul kriterini süresinde ve eksiksiz olarak ifa ettiğinin TESPİTİNE,",
          "3. İşverenin 7 günlük yasal sürede somut teknik ayıp bildirimi yapmaması sebebiyle TBK m. 477 uyarınca eserin ZIMNEN KABUL EDİLDİĞİNE,",
          "4. 85.000 TL (Seksenbeş Bin Türk Lirası) hakediş bedelinin davalı yazılımcıya DERHAL VE DEF'ATEN ÖDENMESİNE,",
          "5. İşbu kararın HMK m. 193 delil sözleşmesi uyarınca taraflar nezdinde KESİN, İCRA EDİLEBİLİR VE BAĞLAYICI OLDUĞUNA,",
        ],
        judicialReasoningTitle: "Gerekçeli Hukuki Görüş:",
        judicialReasoning:
          "Yazılım geliştirme sözleşmeleri Türk Borçlar Kanunu kapsamında 'Eser Sözleşmesi' niteliğindedir. İş sahibinin subjektif beğenisi tek başına sözleşmeden dönme hakkı vermez. TBK 474 gereği muayene ve ihbar külfetini süresinde yerine getirmeyen işveren eseri TBK 477 gereğince kabul etmiş sayılır. HMK 193 uyarınca taraflarca imzalanmış Lancerix kriptografik zaman damgaları münhasır delil teşkil eder.",
        signatureTitle: "Hakem Heyeti & Zabıt Kâtibi İmzaları",
        signatureClerk: "Zabıt Kâtibi (Adli Bilişim Sistem Logu)",
        signaturePresident: "Hakem Heyeti Başkanı (Teknik Bilirkişi)",
        sha256Seal: "HMK 193 Karar Parmak İzi: 9f2c41ab7e0d5386c1b4a9f70e2d8c35b6a147f9e0c283d5a6b7c8d9e0f1a2b3",
        downloadPdfCta: "Resmi Mahkeme & Bilirkişi İlamını İndir (PDF)",
        publicVerifyCta: "Kamu Doğrulama Sayfasını Aç",
        qrNotice: "PDF üzerinde mahkeme heyetince onaylı dinamik karekod ve adli mühür yer almaktadır.",
      },
    },
    bottomCta: {
      title: "Senin de 50.000 TL - 500.000 TL Arası Teslimatın Askıda Kalmasın",
      description:
        "Projenin başında kriterlerini koda bağla. ProofGuard canlı teslimat kanıtı ve TBK 477 korumasıyla emeğini güvence altına al.",
      button: "Tahkim Korumalı Sözleşme Başlat",
      secondary: "Güven Mimarisini İncele",
    },
  },
  en: {
    metaTitle: "85,000 ₺ Jewelry & MASAK Arbitration Case — Digital Courtroom Trial",
    metaDescription:
      "Explore how a bad-faith contract cancellation in a live FX API project was dismissed under statutory acceptance (TBK Art. 477) and binding evidence agreements (HMK Art. 193). Experience a real digital tribunal trial.",
    courtHeader: {
      institution: "DIGITAL ARBITRATION & INDEPENDENT FORENSIC BENCH",
      chamber: "3rd Commercial & Software Disputes Arbitral Tribunal",
      caseNo: "Docket No: 2026/85000-JEWELRY",
      docketRef: "LCX-2026-85000-KUYUMCU",
      sessionBadge: "TRIBUNAL TRANSCRIPT · FINAL BINDING AWARD",
      amount: "85,000 ₺",
      amountLabel: "Disputed Milestone & Award Value",
      decisionDate: "October 06, 2026",
      statusBadge: "AWARD ENFORCED (Art. 193 CPC)",
    },
    hero: {
      badge: "Founder's Real Dispute · The Lived Crisis of Samed Çoban",
      title: "85,000 ₺ Grand Bazaar Jewelry & MASAK Project: Dismantling Bad-Faith Rejection",
      subtitle:
        "The lived crisis of Lancerix founder Samed Çoban that triggered the creation of this platform: 22 days of engineering live WebSocket gold rate feeds and MASAK AML compliance, delivered with zero defects. When the corporate client cited 'gold prices fluctuated and we dislike the aesthetics' to withhold the final fee, statutory Art. 477 tacit acceptance and Art. 193 evidence seals secured 100% of the funds. Step inside the tribunal and preside over the case.",
      storyCta: "Read the Founder's Story",
      trialCta: "Start Tribunal Session (Strike Gavel)",
    },
    parties: {
      title: "Tribunal Parties & Claims",
      subtitle: "Formal pleadings under the Code of Obligations and Civil Procedure Code",
      claimant: {
        role: "Claimant / Objecting Employer",
        name: "Altın & Mücevherat E-Commerce Corp.",
        title: "Grand Bazaar Wholesale & Retail Gold Trading",
        representative: "Hakan B. (VP of Operations)",
        avatar: "🏛️",
        claimSummary:
          "\"The software was deployed, but our CEO just didn't like the feel. The colors didn't fit our corporate vibe, and live pricing felt 1-2 seconds slow to our eyes. We refuse to pay the final invoice, terminate the contract unilaterally, and demand a full refund.\"",
        demands: "Contract cancellation, milestone non-payment, full advance refund.",
      },
      respondent: {
        role: "Respondent / Lead Engineer & Founder",
        name: "Samed Çoban (Founder of Lancerix & Senior Systems Architect)",
        title: "Independent Principal Fullstack & FinTech Engineer",
        representative: "Self-Represented (Guaranteed by Lancerix Protocol)",
        avatar: "💻",
        claimSummary:
          "\"All 4 contractually defined acceptance criteria were delivered in full working order. On the staging host, WebSocket latency was measured at 138ms (beating the <250ms SLA). Over 7 days and 2 hours passed since handover; the employer raised zero technical defect tickets under Art. 474. Under statutory Art. 477, the deliverable is tacitly accepted.\"",
        demands: "Immediate release of the 85,000 ₺ milestone, evidentiary confirmation.",
      },
      tribunal: {
        name: "Lancerix Software Arbitral Bench",
        title: "Cryptographic Computer Forensics & Arbitral Tribunal",
        role: "Independent Arbitrator & Expert Witness",
        authority: "Binding Exclusive Evidence Agreement under Art. 193 CPC",
      },
    },
    story: {
      title: "The Anatomy of a Real Freelance Crisis",
      subtitle: "From contract specification to staging, the 7-day silence trap, and the tribunal verdict",
      chapters: [
        {
          index: "01",
          day: "Day 1",
          title: "Contract & Specification as Code",
          date: "Sep 14, 2026 · 09:00",
          summary: "Replacing subjective promises with mathematical acceptance criteria.",
          detail:
            "A Grand Bazaar gold trading enterprise contracted an independent engineer to build a real-time gold/FX pricing WebSocket feed and MASAK AML identity verification engine. A contract valued at 85,000 ₺ was established on Lancerix; 4 objective criteria were encoded into specifications and mutually sealed with SHA-256 digital signatures.",
          badge: "Art. 193 CPC Signed",
          badgeColor: "emerald",
          technicalArtifact: {
            label: "Contract SHA-256 Root Seal",
            value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          },
        },
        {
          index: "02",
          day: "Day 22",
          title: "Development & ProofGuard Live Handover",
          date: "Oct 06, 2026 · 14:30",
          summary: "System deployed to staging with ProofGuard sentinel monitoring telemetry.",
          detail:
            "After 22 days of development uniting 4 market WebSocket feeds, order cart locking, and MASAK tax ID lookups, the developer deployed to staging. The ProofGuard sentry continuously inspected health: HTTP 200 OK, TLS 1.3, and a 138ms average response time were sealed into the evidentiary record.",
          badge: "ProofGuard Active",
          badgeColor: "indigo",
          technicalArtifact: {
            label: "Delivery Fingerprint",
            value: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
          },
        },
        {
          index: "03",
          day: "Days 23-29",
          title: "The Silence Trap & 7-Day Statutory Countdown",
          date: "Oct 06 - 13, 2026",
          summary: "The employer verbally acknowledged delivery, then went completely silent to stall payment.",
          detail:
            "The engineer delivered the live demonstration. The corporate client said 'Thank you, we are reviewing it.' However, over the next 7 days, they opened zero defect reports and cited no technical faults, attempting to cool down the process to evade invoice payment. Lancerix's statutory Art. 477 clock ran autonomously in the background.",
          badge: "Art. 474 Statutory Window",
          badgeColor: "amber",
          technicalArtifact: {
            label: "Statutory Inspection Window",
            value: "7 Days 00 Hours Expired · Zero Defect Logs Submitted",
          },
        },
        {
          index: "04",
          day: "Day 30",
          title: "Wrongful Termination: 'We don't like the feel!'",
          date: "Oct 14, 2026 · 10:15",
          summary: "When the payment deadline struck, the client cited subjective excuses to cancel.",
          detail:
            "Once the statutory window lapsed, the employer emailed: 'Our board does not like the look, and prices feel slow to our eyes; we cancel the project and demand our advance back.' In traditional freelancing, this would mean months of unpaid litigation. On Lancerix, the exact opposite unfolded.",
          badge: "Subjective Claim",
          badgeColor: "rose",
          technicalArtifact: {
            label: "Employer Justification",
            value: "\"Subjective dislike\" (Zero forensic or server log evidence)",
          },
        },
        {
          index: "05",
          day: "Verdict Day",
          title: "Tribunal Ruling: Bad-Faith Rejection Dismantled",
          date: "Oct 14, 2026 · 14:00",
          summary: "Binding evidence under Art. 193 and statutory acceptance under Art. 477 secured 85,000 ₺.",
          detail:
            "The Lancerix Arbitral Tribunal examined the case dossier. The employer's subjective arguments were dismissed under Art. 474 and 477. Backed by immutable ProofGuard telemetry and SHA-256 expert witness seals, the 85,000 ₺ payout was ordered released immediately to the engineer.",
          badge: "Art. 193 Final Award",
          badgeColor: "cyan",
          technicalArtifact: {
            label: "Final Award Reference",
            value: "LCX-2026-85000-KUYUMCU · 100% In Favor of Developer",
          },
        },
      ],
    },
    courtroom: {
      title: "Interactive Arbitral Courtroom & Hearing Room",
      subtitle:
        "Strike the gavel, review stenographer transcripts, probe live forensics from the bench, and issue judicial rulings on the client's objections.",
      gavelPrompt: "Click to Strike the Judicial Gavel & Open the Hearing",
      gavelStrikeLabel: "STRIKE JUDICIAL GAVEL (OPEN HEARING)",
      gavelAudioNotice: "Gavel strike synthesized live using Web Audio API.",
      stenographerTitle: "Court Stenographer Live Transcript Feed",
      stenographerLive: "LIVE COURT RECORDING IN PROGRESS",
      tabs: {
        phase1: "1. Pleadings & Claims",
        phase2: "2. Forensic Evidence Bench",
        phase3: "3. Cross-Examination",
        phase4: "4. Enforceable Arbitral Award",
      },
      phase1: {
        title: "Phase 1: Opening of Trial & Pleadings",
        description:
          "The arbitral bench places the mutually agreed technical specifications and formal statements on the official docket.",
        claimantHeader: "Claimant / Objecting Employer Pleading:",
        respondentHeader: "Respondent / Lead Engineer Defense:",
        contractDigestTitle: "Contract Digest & Admissible Evidence Agreement:",
        contractDigestItems: [
          { label: "Dossier Reference", value: "LCX-2026-85000-KUYUMCU" },
          { label: "Milestone Payout", value: "85,000 ₺ (Eighty-Five Thousand Turkish Liras)" },
          { label: "Scope of Deliverable", value: "Live Gold & FX Pricing Engine with MASAK AML" },
          { label: "Statutory Inspection Window", value: "7-Day Inspection Duty under Art. 474 Code of Obligations" },
          { label: "Cryptographic Attestation", value: "Bilateral SHA-256 Signatures Admissible under Art. 193 CPC" },
        ],
      },
      phase2: {
        title: "Phase 2: Forensic Evidence Bench & Live Probe Examination",
        description:
          "The arbitral bench performs real-time telemetry verification against the delivered staging server and verifies evidence logs.",
        probeTitle: "ProofGuard Live Forensic Telemetry Prober",
        probeStatusReady: "Forensic probe standby · Click to run live network audit",
        probeStatusRunning: "Probing staging endpoint... Auditing TLS 1.3 and HTTP 200...",
        probeStatusSuccess: "Forensic Audit Verified: Staging is 100% Healthy and Within Contract SLA!",
        runProbeButton: "Run Live Forensic Probe (Ping & TLS Handshake)",
        evidences: [
          {
            id: "ev1",
            code: "EXHIBIT-A",
            title: "ProofGuard Real-Time Uptime & Latency Telemetry",
            category: "Forensic Telemetry",
            status: "VERIFIED",
            legalCitation: "Art. 193 Exclusive Evidence",
            summary:
              "Staging host ran with 100% uptime over 7 consecutive days, averaging 138ms response time, beating the contractual <250ms SLA requirement.",
            technicalData: {
              "HTTP Status": "200 OK",
              "Average Latency": "138 ms",
              "Agreed SLA": "< 250 ms (Passed)",
              "Transport": "TLS 1.3 / HSTS",
            },
          },
          {
            id: "ev2",
            code: "EXHIBIT-B",
            title: "Statutory 7-Day Silence & Tacit Acceptance Docket",
            category: "Cryptographic Timestamp",
            status: "LEGAL_PROOF",
            legalCitation: "Art. 477 Statutory Acceptance",
            summary:
              "Handover occurred on 06.10.2026 at 14:30. Over the 7-day statutory window (168 hours), zero defect tickets were logged by the employer.",
            technicalData: {
              "Handover Time": "2026-10-06 14:30:00",
              "Statutory Deadline": "2026-10-13 14:30:00",
              "Uncontested Time": "7 Days 02 Hours",
              "Legal Effect": "Tacit Acceptance Enforced",
            },
          },
          {
            id: "ev3",
            code: "EXHIBIT-C",
            title: "MASAK AML Identity & 180s Price Locking Log",
            category: "Immutable Audit Log",
            status: "VERIFIED",
            legalCitation: "Art. 199 Electronic Record",
            summary:
              "Identity verification for transactions >10,000 ₺ and dynamic cart lock mechanism tested against simulated volatility; verified.",
            technicalData: {
              "AML Module": "Active & Compliant",
              "Cart Freeze": "180s Rate Lock",
              "Audit SHA-256": "7a41ef689bc...981c",
            },
          },
        ],
      },
      phase3: {
        title: "Phase 3: Cross-Examination & Objection Simulator",
        description:
          "Select each of the 3 arguments presented by the employer to hear the arbitral bench's legal and technical ruling.",
        selectPrompt: "Select Employer Objection to Preside Over:",
        objections: [
          {
            id: "obj1",
            objectionTitle: "Objection 1: \"We don't like the design or the color shades!\"",
            employerArgument:
              "\"Our executive committee felt the design lacked corporate prestige and the color palette felt off. We cancel the project and demand our advance back.\"",
            courtRuling: "REJECTED",
            rulingTitle: "BENCH RULING: OBJECTION OVERRULED (REJECTED)",
            rulingReasoning:
              "Under established contract law and Art. 474 of the Code of Obligations, subjective aesthetic preferences outside the agreed technical criteria do not establish a legal defect. An employer cannot refuse performance based on personal whims.",
            legalBasis: "Art. 474 / Art. 193 CPC",
            evidenceRef: "Agreed Criteria #1-#4",
          },
          {
            id: "obj2",
            objectionTitle: "Objection 2: \"Live gold rates feel 1-2 seconds slow to us!\"",
            employerArgument:
              "\"The system works, but rates feel delayed compared to physical Grand Bazaar boards. This constitutes a performance defect.\"",
            courtRuling: "UNSUBSTANTIATED",
            rulingTitle: "BENCH RULING: UNSUBSTANTIATED CLAIM DISMISSED",
            rulingReasoning:
              "Forensic telemetry and WebSocket ping records reveal an average latency of 138ms, well inside the contractual 250ms SLA. The employer provided zero network logs or evidence of performance degradation.",
            legalBasis: "Art. 190 Burden of Proof",
            evidenceRef: "EXHIBIT-A ProofGuard Telemetry (138 ms)",
          },
          {
            id: "obj3",
            objectionTitle: "Objection 3: \"We called on Day 8 to say we were unsatisfied!\"",
            employerArgument:
              "\"We reached out by phone 8 days after delivery and verbally said we were unsatisfied; therefore, we never accepted the work.\"",
            courtRuling: "TIME_BARRED",
            rulingTitle: "BENCH RULING: TIME-BARRED UNDER STATUTE OF ACCEPTANCE",
            rulingReasoning:
              "Under mandatory provisions of Art. 474 and 477, an employer is obligated to inspect the work and notify defects promptly within the 7-day inspection window. Late verbal objections after the statutory deadline are void; work is legally TACITLY ACCEPTED.",
            legalBasis: "Art. 477 Statutory Acceptance",
            evidenceRef: "EXHIBIT-B 7-Day Statutory Inspection Timer",
          },
        ],
      },
      phase4: {
        title: "Phase 4: Enforceable Arbitral Award & Final Judgment",
        description:
          "The Arbitral Bench, having weighed the forensic evidence and statutory provisions, renders its final and binding award.",
        decreeHeader: "IN THE NAME OF JUSTICE",
        decreeSubheader: "DIGITAL ARBITRAL TRIBUNAL FINAL AWARD",
        decreeNumber: "Award No: 2026/85000-K · Docket No: 2026/85000-JEWELRY",
        verdictRulingTitle: "OPERATIVE VERDICT:",
        verdictItems: [
          "1. Claimant employer's claim for unilateral cancellation and refund is DISMISSED WITH PREJUDICE,",
          "2. Finding that Respondent developer delivered all 4 contractual criteria timely and without defect,",
          "3. Confirming that due to employer's failure to notify defects within 7 days, work is DEEMED TACITLY ACCEPTED under Art. 477,",
          "4. Ordering immediate and unencumbered release of the 85,000 ₺ milestone payout to Respondent engineer,",
          "5. Declaring this arbitral award FINAL, ENFORCEABLE, AND BINDING upon all parties under Art. 193 CPC.",
        ],
        judicialReasoningTitle: "Judicial Opinion & Legal Basis:",
        judicialReasoning:
          "Software contracts are governed as contracts for work under commercial obligations law. Subjective distaste does not confer a right of rescission. An employer who fails their inspection duty under Art. 474 is legally deemed to have accepted the work under Art. 477. Bilaterally signed SHA-256 time-stamps constitute exclusive binding evidence under Art. 193 CPC.",
        signatureTitle: "Bench & Stenographer Attestations",
        signatureClerk: "Court Stenographer (System Audit Trail)",
        signaturePresident: "Presiding Arbitrator (Independent Forensic Witness)",
        sha256Seal: "Art. 193 CPC Award Fingerprint: 9f2c41ab7e0d5386c1b4a9f70e2d8c35b6a147f9e0c283d5a6b7c8d9e0f1a2b3",
        downloadPdfCta: "Download Official Judicial & Expert PDF Award",
        publicVerifyCta: "Open Public Verification Portal",
        qrNotice: "The official PDF bears a dynamic QR code and cryptographic court seal.",
      },
    },
    bottomCta: {
      title: "Never Leave a 50,000 ₺ - 500,000 ₺ Delivery in Jeopardy",
      description:
        "Bind your criteria to code from day one. Protect your hard work with ProofGuard forensic delivery proof and statutory acceptance under Art. 477.",
      button: "Start Protected Contract",
      secondary: "Explore Trust Architecture",
    },
  },
};
