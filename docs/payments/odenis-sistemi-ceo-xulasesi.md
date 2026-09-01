# AxtarIS — Ödəniş Sistemi: Qərar və İzah

*CEO üçün xülasə · 1 sentyabr 2026 · Sadə dildə*

---

## 1. Qərar bir cümlə ilə

**Şirkətlər (işəgötürənlər) abunə haqqını saytımızda ödəyəcək, namizədlər isə telefondakı tətbiqin içində — Apple və Google vasitəsilə. Bir müddət sonra Azərbaycan kartları üçün yerli manat ödənişini də əlavə edəcəyik.**

## 2. Niyə belə?

- **Apple-ın qaydası belədir.** Adi istifadəçiyə (namizədə) tətbiqin içində abunə satırıqsa, ödəniş mütləq Apple-ın öz sistemindən keçməlidir. Başqa yol qadağandır — pozsaq, tətbiqi mağazadan çıxara bilərlər. Google-da da hələlik oxşar qayda var.
- **Şirkətlərə isə saytdan satmaq olar.** Biznes müştərilərə xidməti saytda satıb tətbiqdə istifadə etdirmək dünyada qəbul olunmuş yoldur (Slack, Zoom belə işləyir). Saytdan satanda Apple-a heç nə vermirik.
- **Bank kartı ilə dünya üzrə pul yığmaq üçün "Paddle" adlı şirkəti seçdik.** Paddle bizim yerimizə satıcı kimi çıxış edir: vergiləri, qaimə-fakturaları, geri qaytarmaları öz üzərinə götürür. Azərbaycandan olan satıcılarla işləyir — hətta şirkətimiz rəsmiləşməmişdən əvvəl də başlaya bilərik.
- **Məşhur alternativ olan "Stripe" Azərbaycanda işləmir.** Onu istifadə etmək üçün xaricdə şirkət açmaq lazımdır — bu, əlavə xərc və baş ağrısıdır. Hələlik lazım deyil.
- **Pul bizə çatır:** Paddle pulu hər ay bank hesabımıza və ya Payoneer-ə köçürür. Apple və Google da qazancı birbaşa bank hesabına göndərir.

## 3. Pul necə hərəkət edir?

**Şirkət müştəri (məsələn, "Premium" plan — $49):**
Şirkət saytımızda kartla ödəyir → Paddle pulu qəbul edir, qaiməni verir → hər ay yığılan məbləği bizə köçürür → müştərinin tətbiqdəki hesabı avtomatik açılır.

**Namizəd (məsələn, "Pro" plan — $5):**
Namizəd tətbiqdə "Abunə ol" düyməsinə basır → ödəniş Apple/Google-dan keçir → onlar öz payını saxlayıb qalanını bizə göndərir → namizədin imkanları dərhal açılır.

Hər iki halda sistem özü işləyir — heç kim əl ilə heç nə açmır.

## 4. Nə qədər xərc çıxır?

Hər 100 dollarlıq satışdan bizə nə qalır:

| Ödəniş yolu | Haqq | Bizə qalan |
|---|---|---|
| Şirkətlər saytda (Paddle) | ~$5.50 | **~$94.50** |
| Namizədlər tətbiqdə (Apple/Google) | $15 | **~$85** |
| Gələcəkdə yerli manat ödənişi (Payriff) | ~$2–3 | **~$97–98** |

Gördüyünüz kimi, saytdan satış daha sərfəlidir — ona görə böyük pulu (şirkət abunələrini) saytdan yığırıq. Namizədlərdə isə başqa yol yoxdur: Apple qayda ilə 15% götürür.

## 5. Bizdən nə tələb olunur?

| İş | Xərc | Vaxt |
|---|---|---|
| Azərbaycanda MMC qeydiyyatı (elektron) | Pulsuz | ~3 iş günü |
| Bankda dollar hesabı (MMC üçün) | Pulsuz/az | ~1 həftə |
| Apple developer hesabı | $99 / il | 1–4 həftə (yoxlama ilə) |
| Google Play hesabı | $25 (birdəfəlik) | ~1 həftə |
| Paddle qeydiyyatı (pasport + sayt lazımdır) | Pulsuz | bir neçə gün |
| Saytda qaydalar səhifələri (şərtlər, məxfilik, geri qaytarma) | Hazırlanır | — |

Texniki quraşdırma bütövlükdə **4–6 həftə** çəkəcək.

## 6. Risklər və ehtiyat planı

- **18% məsələsi.** 2026-cı ilin sentyabrından Azərbaycan bankları xarici saytlara edilən şəxsi ödənişlərdən 18% vergi tuta bilər. Yəni Azərbaycandakı namizəd saytda dollarla ödəsə, ona baha başa gələr. Həllimiz: Azərbaycandakı namizədlər tətbiqin içindən ödəsin (orada bu problem yoxdur), sonra isə yerli manat ödənişini işə salaq.
- **Paddle bizi qəbul etməsə?** Ehtiyat variantımız hazırdır — "Polar" adlı oxşar xidmət, o da Azərbaycanla işləyir. Bir neçə günə keçid etmək olur.
- **Apple şirkət planlarına irad tutsa?** Nadir haldır, amma olsa — şirkət planlarını da tətbiqin içində satmalı olacağıq (15% itiririk, iş dayanmır).
- **Qaydalar dəyişir.** Apple və Google-un qaydaları məhkəmələr üzündən yumşalır. 2027-ci ilin sonundan Android-də saytın linkini birbaşa tətbiqdə göstərmək mümkün olacaq — o zaman xərcləri yenidən hesablayacağıq.

## 7. Vaxt cədvəli

| Mərhələ | Nə vaxt | Nə baş verir |
|---|---|---|
| 1 | İndi → +6 həftə | MMC, hesablar, Paddle + Apple/Google ödənişləri işə düşür. İlk real satış mümkün olur. |
| 2 | 2027-ci ilin əvvəli | Yerli manat ödənişi (Payriff) — Azərbaycan kartları üçün rahat və ucuz yol. |
| 3 | Sentyabr 2027 | Android-də saytdan alışa birbaşa keçid açılır — xərclərə yenidən baxırıq. |

## 8. Suallar üçün

Bu sənəd texniki araşdırmanın xülasəsidir. Tam ingiliscə versiya: `payment-system-analysis.md` (rəqəmlərin mənbələri ilə birlikdə).

**Əlaqə:** info@axtaris.app
