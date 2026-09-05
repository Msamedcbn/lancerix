import type { Locale } from "@/lib/i18n/config";

/**
 * The /nasil-calisir (and /en/how-it-works) system diagram page.
 *
 * The state-machine node names (DRAFT, AWAITING_PAYMENT, ...) and the edge
 * captions above each card are deliberately NOT translated: they are the
 * literal identifiers in escrow_status_transitions and TRANSITIONS, and a
 * reader comparing the diagram against the code should see the same tokens.
 * Everything a human reads as prose is translated.
 */
type Step = { title: string; body: string };
type SplitRow = { label: string; note: string };

export type SystemFlowCopy = {
  metaTitle: string;
  metaDescription: string;
  nav: { flow: string; split: string; states: string; earlyAccess: string };
  heroLine1: string;
  heroLine2: string;
  heroBody: string;
  heroPrimary: string;
  heroSecondary: string;
  bannerStrong: string;
  bannerBody: string;
  flowTitle: string;
  /** Exactly five, paired with FLOW_STEP_META in system-flow.tsx by position. */
  steps: readonly [Step, Step, Step, Step, Step];
  diagramLabels: {
    contract: string;
    lock: string;
    milestone: string;
    countdown: string;
    split: string;
    graph: string;
  };
  nodes: {
    freelancer: string;
    client: string;
    platform: string;
    lockedBalance: string;
    noAccess: string;
    phase: string;
    delivery: string;
    paid: string;
    locked: string;
    pending: string;
    submitted: string;
    approved: string;
    objectionWindow: string;
    released: string;
    serviceFee: string;
    withholding: string;
    freelancerNet: string;
  };
  splitTitle: string;
  splitBody: string;
  splitFundedLabel: string;
  /** Fee, withholding, net -- in that order, matching SPLIT_ROW_META. */
  splitRows: readonly [SplitRow, SplitRow, SplitRow];
  splitFootnote: (gross: string) => string;
  statesTitle: string;
  statesBody: string;
  legendNormal: string;
  legendDispute: string;
  legendCancel: string;
  rulesTitle: string;
  ledgerTitle: string;
  ledgerBody: string;
  webhookTitle: string;
  webhookBody: string;
  exactTitle: string;
  exactBody: string;
  rlsTitle: string;
  rlsBody: string;
  closingTitle: string;
  closingPrimary: string;
  closingSecondary: string;
  footerLogin: string;
};

export const SYSTEM_FLOW_COPY: Record<Locale, SystemFlowCopy> = {
  tr: {
    metaTitle: "Sistem nasıl çalışır",
    metaDescription:
      "Sözleşmeden ödemeye kadar paranın izlediği yolun adım adım şeması: escrow durum makinesi, komisyon ve stopaj dağılımı, kayıt defteri.",
    nav: {
      flow: "Akış",
      split: "Para dağılımı",
      states: "Durum şeması",
      earlyAccess: "Erken erişim",
    },
    heroLine1: "Paranın izlediği yol",
    heroLine2: "baştan sona görünür.",
    heroBody:
      "Sözleşmenin imzalandığı andan paranın hesabınıza geçtiği ana kadar her adım, her durum ve her kuruş aşağıda şemayla yazılı.",
    heroPrimary: "Akışı incele",
    heroSecondary: "Erken erişime katıl",
    bannerStrong: "Aşağıdaki şema hedef mimarimiz, bugünkü sistem değil.",
    bannerBody:
      "Şu anda Lancerix bir doğrulama ve raporlama hizmeti: sözleşme, teslim, QA doğrulaması ve kabul süreci (aşağıdaki 4. adım) canlı, ödeme ise taraflar arasında doğrudan çözülüyor. Escrow, stopaj kesintisi ve otomatik ödeme dağıtımı (1, 2, 3 ve 5. adımlar) şirket kuruluşu ve ödeme lisansı sonrasında devreye girecek yol haritamız.",
    flowTitle: "Beş adım, beş şema, tek yön.",
    steps: [
      {
        title: "Üç taraflı sözleşme",
        body: "Freelancer, müşteri ve platform aynı belgeyi imzalar. Tutar, aşamalar, itiraz süresi ve stopaj oranı imza anında dondurulur; sonradan tek taraflı değişmez.",
      },
      {
        title: "Para kilitlenir",
        body: "Müşteri aşamanın tutarını hizmet bedeliyle birlikte, iş başlamadan yatırır. Tutar lisanslı bir ödeme kuruluşunda tutulacak; ne freelancer çekebilir ne müşteri geri alabilir.",
      },
      {
        title: "Aşama aşama ilerler",
        body: "Proje tek bir büyük ödeme değil, sırayla açılan aşamalardır. Her aşamanın parası kendi başına kilitlenir ve kendi başına serbest kalır; biri tıkanırsa diğerleri etkilenmez.",
      },
      {
        title: "Teslim ve geri sayım",
        body: "Freelancer teslimatı yükler, geri sayım o an başlar. Müşteri onaylarsa aşama hemen kapanır; süre içinde itiraz etmezse de kapanır. Beklemek varsayılan değildir.",
      },
      {
        title: "Ödeme dağıtılır",
        body: "Tutar serbest kalır ve tek seferde ayrışır: hizmet bedeli platforma, stopaj vergi dairesine, sözleşme bedelinin kalanı freelancera. Ödeme yalnızca aşama tamamlandıysa ve tutar net hesaba birebir eşitse tetiklenir.",
      },
    ],
    diagramLabels: {
      contract: "Freelancer, müşteri ve platform aynı sözleşmeyi imzalar",
      lock: "Müşteri tutarı yatırır, para kilitli hesapta tutulur",
      milestone: "Proje aşamalara bölünür, her aşama ayrı ödenir",
      countdown: "Teslimden sonra süre işler, itiraz gelmezse ödeme açılır",
      split:
        "Serbest kalan tutar hizmet bedeli, stopaj ve freelancer neti olarak ayrılır",
      graph:
        "Escrow durum makinesi: DRAFT, AWAITING_PAYMENT, IN_PROGRESS, SUBMITTED, COMPLETED, RELEASED ana hattı ile DISPUTED ve CANCELLED dalları",
    },
    nodes: {
      freelancer: "Freelancer",
      client: "Müşteri",
      platform: "Platform",
      lockedBalance: "kilitli bakiye",
      noAccess: "erişim yok",
      phase: "Aşama",
      delivery: "Teslim",
      paid: "ödendi",
      locked: "kilitte",
      pending: "bekliyor",
      submitted: "Teslim",
      approved: "Onay",
      objectionWindow: "itiraz penceresi",
      released: "Serbest",
      serviceFee: "Hizmet bedeli",
      withholding: "Stopaj",
      freelancerNet: "Freelancer neti",
    },
    splitTitle: "10.000 TL'lik bir aşamada kim ne öder?",
    splitBody:
      "Hizmet bedeli freelancerın kazancından kesilmez, sözleşme bedelinin üstüne eklenir ve müşteri tarafından ödenir. Freelancerın eline geçen tutar, platformu hiç kullanmasaydı alacağı tutarın aynısıdır; tek fark, 90 gün önce geçmesidir.",
    splitFundedLabel: "Müşterinin escrow'a yatırdığı",
    splitRows: [
      {
        label: "Platform hizmet bedeli",
        note: "Sözleşme bedelinin üstüne eklenir, müşteri öder",
      },
      {
        label: "Stopaj",
        note: "Freelancerın brütünden kesilir, vergi dairesine ödenir",
      },
      { label: "Freelancer neti", note: "Banka hesabına geçen tutar" },
    ],
    splitFootnote: (gross) =>
      `Freelancerın sözleşme bedeli ${gross} TL olarak kalır ve serbest meslek makbuzu bu tutar üzerinden kesilir; stopaj da bu tutardan hesaplanır. Oranlar sözleşme kurulduğu anda dondurulur, sonradan değişen bir oran imzalanmış bir işi etkilemez.`,
    statesTitle: "Bir aşamanın girebileceği her durum.",
    statesBody:
      "Aşağıdaki oklar dışında bir geçiş yoktur. Listede olmayan her hareket yazılmadan önce reddedilir, bu yüzden bir aşama sırayı atlayarak ödemeye ulaşamaz.",
    legendNormal: "Normal akış",
    legendDispute: "İtiraz",
    legendCancel: "İptal",
    rulesTitle: "Şemayı yerinde tutan dört kural.",
    ledgerTitle: "Silinemeyen kayıt defteri",
    ledgerBody:
      "Durum değişikliği yalnızca defteri aynı işlem içinde yazan tek bir fonksiyondan geçer. Defterde güncelleme ve silme yoktur; bir hareket yazıldıktan sonra geri alınamaz, ancak üstüne yeni bir hareket yazılır.",
    webhookTitle: "Doğrulanmış webhook",
    webhookBody:
      "Ödeme kuruluşundan gelen her bildirim imzasıyla doğrulanır. Doğrulanmayan bir bildirim hiçbir durumu ilerletmez.",
    exactTitle: "Birebir ödeme",
    exactBody:
      "Ödeme, hesaplanan net tutara tam olarak eşit değilse tetiklenmez. Yaklaşık tutar diye bir şey yoktur.",
    rlsTitle: "Satır bazında erişim",
    rlsBody:
      "Freelancer yalnızca kendi işlerini, müşteri yalnızca kendi projelerini görür. İtiraz çözümü ve elle serbest bırakma sadece yöneticide.",
    closingTitle: "Şemayı gördünüz. Sıra ilk projede.",
    closingPrimary: "Erken erişime katıl",
    closingSecondary: "Ana sayfaya dön",
    footerLogin: "Giriş yap",
  },
  en: {
    metaTitle: "How the system works",
    metaDescription:
      "A step-by-step diagram of the route money takes from contract to payout: the escrow state machine, the fee and withholding split, and the append-only ledger.",
    nav: {
      flow: "Flow",
      split: "Money split",
      states: "State diagram",
      earlyAccess: "Early access",
    },
    heroLine1: "Every step the money takes,",
    heroLine2: "visible end to end.",
    heroBody:
      "From the moment the contract is signed to the moment the money lands in your account, every step, every state and every kuruş is drawn out below.",
    heroPrimary: "Walk the flow",
    heroSecondary: "Join early access",
    bannerStrong: "The diagram below is our target architecture, not today's system.",
    bannerBody:
      "Right now Lancerix is a verification and reporting service: the contract, the delivery, the QA verification and the acceptance window (step 4 below) are live, while payment is settled directly between the parties. Escrow, tax withholding and the automatic payout split (steps 1, 2, 3 and 5) are the roadmap — they arrive once the company and the payment licence are in place.",
    flowTitle: "Five steps, five diagrams, one direction.",
    steps: [
      {
        title: "A three-way contract",
        body: "The freelancer, the client and the platform sign the same document. The amount, the phases, the objection window and the withholding rate are frozen at signing; after that no single party can change them.",
      },
      {
        title: "The money is locked",
        body: "Before work starts, the client funds the phase amount together with the service fee. It sits with a licensed payment institution — the freelancer cannot withdraw it and the client cannot claw it back.",
      },
      {
        title: "It moves phase by phase",
        body: "A project is not one large payment but a sequence of phases. Each phase's money is locked and released on its own, so one stalling never blocks the rest.",
      },
      {
        title: "Delivery and countdown",
        body: "The freelancer submits the work and the clock starts there. Approve, and the phase closes immediately; say nothing within the window, and it closes anyway. Waiting is not the default state.",
      },
      {
        title: "The payout splits",
        body: "The amount is released and divided in one pass: the service fee to the platform, the withholding to the tax office, the rest of the contract amount to the freelancer. A payout only fires when the phase is complete and the amount matches the calculated net exactly.",
      },
    ],
    diagramLabels: {
      contract: "The freelancer, the client and the platform sign the same contract",
      lock: "The client funds the amount and it is held in a locked balance",
      milestone: "The project splits into phases, each paid on its own",
      countdown:
        "After delivery a clock runs; with no objection the payment opens",
      split:
        "The released amount divides into the service fee, the withholding and the freelancer's net",
      graph:
        "Escrow state machine: the DRAFT, AWAITING_PAYMENT, IN_PROGRESS, SUBMITTED, COMPLETED, RELEASED main line with the DISPUTED and CANCELLED branches",
    },
    nodes: {
      freelancer: "Freelancer",
      client: "Client",
      platform: "Platform",
      lockedBalance: "locked balance",
      noAccess: "no access",
      phase: "Phase",
      delivery: "Handover",
      paid: "paid",
      locked: "locked",
      pending: "pending",
      submitted: "Delivery",
      approved: "Approved",
      objectionWindow: "objection window",
      released: "Released",
      serviceFee: "Service fee",
      withholding: "Withholding",
      freelancerNet: "Freelancer net",
    },
    splitTitle: "On a ₺10,000 phase, who pays what?",
    splitBody:
      "The service fee is never taken out of the freelancer's earnings — it is added on top of the contract amount and paid by the client. What the freelancer receives is exactly what they would have received without the platform; the only difference is that it arrives 90 days sooner.",
    splitFundedLabel: "What the client funds into escrow",
    splitRows: [
      {
        label: "Platform service fee",
        note: "Added on top of the contract amount, paid by the client",
      },
      {
        label: "Tax withholding",
        note: "Deducted from the freelancer's gross, paid to the tax office",
      },
      { label: "Freelancer net", note: "What reaches their bank account" },
    ],
    splitFootnote: (gross) =>
      `The freelancer's contract amount stays at ₺${gross}, and that is the figure their invoice is issued for; the withholding is calculated from it as well. The rates are frozen when the contract is created, so a rate that changes later never affects work already signed.`,
    statesTitle: "Every state a phase can be in.",
    statesBody:
      "There is no transition other than the arrows below. Any move that is not on this list is rejected before it is written, so a phase can never skip the queue to reach a payout.",
    legendNormal: "Normal flow",
    legendDispute: "Dispute",
    legendCancel: "Cancellation",
    rulesTitle: "Four rules that hold the diagram in place.",
    ledgerTitle: "A ledger that cannot be erased",
    ledgerBody:
      "A status change only ever happens inside the one function that writes the ledger in the same transaction. The ledger has no update and no delete: once an entry is written it cannot be taken back, only followed by a new one.",
    webhookTitle: "Verified webhooks",
    webhookBody:
      "Every notification from the payment provider is checked against its signature. An unverified notification advances nothing.",
    exactTitle: "Exact-amount payouts",
    exactBody:
      "A payout does not fire unless the amount equals the calculated net exactly. There is no such thing as approximately.",
    rlsTitle: "Row-level access",
    rlsBody:
      "Freelancers see only their own work, clients only their own projects. Dispute resolution and manual release are admin-only.",
    closingTitle: "You have seen the diagram. Now the first project.",
    closingPrimary: "Join early access",
    closingSecondary: "Back to home",
    footerLogin: "Log in",
  },
};
