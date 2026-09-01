import type { Locale } from "./types";

/**
 * UI strings for the hosted legal pages (chrome, index, delete-account).
 * The documents themselves live as markdown in src/content/legal
 * (mirrored from docs/legal — the source of truth).
 */

export type LegalPageSlug =
  | "terms"
  | "privacy"
  | "community"
  | "subscriptions"
  | "employer-terms"
  | "delete-account";

export interface LegalUiStrings {
  /** doc-label printed on every legal sheet's header row */
  headerLabel: string;
  indexTitle: string;
  indexIntro: string;
  backToIndex: string;
  /** shown on RU pages that serve the EN master (B2B docs) */
  enOnlyNote: string;
  metaDescription: string;
  docLabels: Record<LegalPageSlug, string>;
  deleteAccount: {
    title: string;
    intro: string;
    inAppTitle: string;
    inAppBody: string;
    emailTitle: string;
    emailBodyBefore: string;
    emailBodyAfter: string;
    whatTitle: string;
    whatItems: string[];
    windowNote: string;
    moreLabel: string;
  };
}

export const legalUi: Record<Locale, LegalUiStrings> = {
  az: {
    headerLabel: "HÜQUQİ SƏNƏDLƏR",
    indexTitle: "Hüquqi sənədlər",
    indexIntro:
      "AxtarIS xidmətindən istifadəni tənzimləyən sənədlər. Suallar üçün: info@axtaris.app.",
    backToIndex: "Bütün hüquqi sənədlər",
    enOnlyNote: "Bu sənəd hazırda yalnız ingilis dilində mövcuddur.",
    metaDescription:
      "AxtarIS platformasının rəsmi hüquqi sənədi — axtaris.app.",
    docLabels: {
      terms: "İstifadə şərtləri",
      privacy: "Məxfilik siyasəti",
      community: "İcma qaydaları",
      subscriptions: "Abunəlik və geri ödəniş şərtləri",
      "employer-terms": "İşəgötürən şərtləri",
      "delete-account": "Hesabın silinməsi",
    },
    deleteAccount: {
      title: "Hesabın silinməsi",
      intro:
        "AxtarIS hesabınızı istənilən vaxt silə bilərsiniz — bunun üçün iki yol var.",
      inAppTitle: "TƏTBİQDƏ",
      inAppBody:
        "Profil → Parametrlər → Hesabı sil. Hesabınız və aşağıda sadalanan məlumatlar birdəfəlik silinir.",
      emailTitle: "E-POÇTLA",
      emailBodyBefore: "Qeydiyyatda istifadə etdiyiniz ünvandan ",
      emailBodyAfter: " ünvanına silinmə tələbi yazın.",
      whatTitle: "NƏ SİLİNİR",
      whatItems: [
        "Hesab və giriş məlumatları",
        "Profil",
        "CV-lər",
        "Müraciətlər (sizdəki nüsxə)",
        "Söhbətlər (yazışmalarda kimliyiniz silinir)",
      ],
      windowNote:
        "Silinmə tələbləri ən geci 30 gün ərzində icra olunur. Silinmə birdəfəlikdir — silinmiş hesabı bərpa etmək mümkün deyil.",
      moreLabel: "Ətraflı: Məxfilik siyasəti",
    },
  },
  en: {
    headerLabel: "LEGAL DOCUMENTS",
    indexTitle: "Legal documents",
    indexIntro:
      "The documents that govern the use of the AxtarIS service. Questions: info@axtaris.app.",
    backToIndex: "All legal documents",
    enOnlyNote: "This document is currently available in English only.",
    metaDescription:
      "An official legal document of the AxtarIS platform — axtaris.app.",
    docLabels: {
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      community: "Community Guidelines",
      subscriptions: "Subscription & Refund Terms",
      "employer-terms": "Employer Terms",
      "delete-account": "Account deletion",
    },
    deleteAccount: {
      title: "Account deletion",
      intro:
        "You can delete your AxtarIS account at any time — in either of two ways.",
      inAppTitle: "IN THE APP",
      inAppBody:
        "Profile → Settings → Delete account. Your account and the data listed below are permanently deleted.",
      emailTitle: "BY EMAIL",
      emailBodyBefore: "Write a deletion request to ",
      emailBodyAfter: " from the email address registered to your account.",
      whatTitle: "WHAT IS DELETED",
      whatItems: [
        "Account and sign-in data",
        "Profile",
        "CVs",
        "Applications (your copy)",
        "Chats (your identity is removed from conversations)",
      ],
      windowNote:
        "Deletion requests are handled within 30 days at the latest. Deletion is permanent — a deleted account cannot be restored.",
      moreLabel: "Details: Privacy Policy",
    },
  },
  ru: {
    headerLabel: "ПРАВОВЫЕ ДОКУМЕНТЫ",
    indexTitle: "Правовые документы",
    indexIntro:
      "Документы, регулирующие использование сервиса AxtarIS. Вопросы: info@axtaris.app.",
    backToIndex: "Все правовые документы",
    enOnlyNote: "Этот документ пока доступен только на английском языке.",
    metaDescription:
      "Официальный правовой документ платформы AxtarIS — axtaris.app.",
    docLabels: {
      terms: "Условия использования",
      privacy: "Политика конфиденциальности",
      community: "Правила сообщества",
      subscriptions: "Условия подписки и возврата",
      "employer-terms": "Условия для работодателей",
      "delete-account": "Удаление аккаунта",
    },
    deleteAccount: {
      title: "Удаление аккаунта",
      intro:
        "Вы можете удалить аккаунт AxtarIS в любой момент — одним из двух способов.",
      inAppTitle: "В ПРИЛОЖЕНИИ",
      inAppBody:
        "Профиль → Настройки → Удалить аккаунт. Аккаунт и перечисленные ниже данные удаляются безвозвратно.",
      emailTitle: "ПО ЭЛ. ПОЧТЕ",
      emailBodyBefore: "Напишите запрос на удаление на ",
      emailBodyAfter: " с адреса, указанного при регистрации.",
      whatTitle: "ЧТО УДАЛЯЕТСЯ",
      whatItems: [
        "Аккаунт и данные для входа",
        "Профиль",
        "CV (резюме)",
        "Отклики (ваша копия)",
        "Чаты (ваша личность удаляется из переписок)",
      ],
      windowNote:
        "Запросы на удаление обрабатываются не позднее чем за 30 дней. Удаление необратимо — восстановить удалённый аккаунт невозможно.",
      moreLabel: "Подробнее: Политика конфиденциальности",
    },
  },
};
