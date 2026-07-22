import type { LanguageCodeValue } from './language.constants';

export const APP_NAME = 'Twinzy';

export const API_GLOBAL_PREFIX = 'api';

export const API_VERSION = 'v1';

/** Versioned REST base every public API path is composed from. */
export const API_BASE_PATH = `/${API_GLOBAL_PREFIX}/${API_VERSION}`;

export const GAME_ANALYZE_PATH = `${API_BASE_PATH}/game/analyze`;

/**
 * Streaming variant of the analyze route. Responds with text/event-stream and
 * keeps the connection alive with heartbeats + progress events, so the long
 * multi-step Gemini pipeline never hits an idle/response timeout.
 */
export const GAME_ANALYZE_STREAM_PATH = `${GAME_ANALYZE_PATH}/stream`;

/**
 * Text-only translation route: takes an existing structured result plus a
 * target language and returns the same result localized — never the image,
 * never a re-analysis, names/scores/ranks preserved server-side.
 */
export const GAME_TRANSLATE_RESULT_PATH = `${API_BASE_PATH}/game/translate-result`;

/**
 * Cancels an in-flight streaming analyze run. Takes the tab/request/stream
 * correlation ids and aborts only the exactly-matching stream, so cancelling
 * one tab never disturbs another tab's (or user's) run.
 */
export const GAME_CANCEL_PATH = `${API_BASE_PATH}/game/cancel`;

export const HEALTH_PATH = `${API_BASE_PATH}/health`;

/**
 * Creates a server-side PayPal order for one paid analysis run. Only exists
 * when the operator configured the paywall (PayPal credentials present) — the
 * game is otherwise free and the endpoint answers 502 when unconfigured.
 */
export const PAYMENTS_ORDERS_PATH = `${API_BASE_PATH}/payments/orders`;

/**
 * Creates a server-side Paymob intention for one paid analysis run (charged in
 * EGP, converted from the canonical USD price). Only meaningful when the Paymob
 * credentials are configured; otherwise the game is free of it.
 */
export const PAYMENTS_PAYMOB_INTENTION_PATH = `${API_BASE_PATH}/payments/paymob/intention`;

/**
 * The active prompt-contract version. Every AI response must echo it; a
 * mismatch fails schema validation, so a stale model/template pairing can
 * never silently serve the old contract.
 */
export const GAME_PROMPT_VERSION = 'written-traits-v5';

/**
 * Server-enforced localized safety disclaimer. The model's own disclaimer
 * text is never trusted or forwarded — aggregation and translation always
 * overwrite it with this fixed copy for the response's languageCode.
 */
export const RESULT_DISCLAIMER_BY_LANGUAGE: Record<LanguageCodeValue, string> = {
  en: 'This is a playful style/vibe result based on written visible traits only. It is not face recognition, identity matching, or biometric comparison.',
  ar: 'هذه نتيجة ممتعة عن الأسلوب والانطباع العام تعتمد على الملامح الظاهرة المكتوبة فقط. وهي ليست تعرّفًا على الوجه ولا مطابقة هوية ولا مقارنة بيومترية.',
  it: 'Questo è un risultato giocoso di stile e vibe basato solo su tratti visibili descritti per iscritto. Non è riconoscimento facciale, né identificazione, né confronto biometrico.',
  fa: 'این یک نتیجهٔ سرگرم‌کننده دربارهٔ سبک و حال‌وهوا است که فقط بر پایهٔ ویژگی‌های ظاهری نوشته‌شده ساخته می‌شود. این تشخیص چهره، تطبیق هویت یا مقایسهٔ بیومتریک نیست.',
  fr: 'Ceci est un résultat ludique de style et de vibe fondé uniquement sur des traits visibles décrits par écrit. Ce n’est ni de la reconnaissance faciale, ni une identification, ni une comparaison biométrique.',
  de: 'Dies ist ein spielerisches Stil-/Vibe-Ergebnis, das ausschließlich auf schriftlich beschriebenen sichtbaren Merkmalen beruht. Es ist keine Gesichtserkennung, kein Identitätsabgleich und kein biometrischer Vergleich.',
  es: 'Este es un resultado lúdico de estilo y vibra basado únicamente en rasgos visibles descritos por escrito. No es reconocimiento facial, ni coincidencia de identidad, ni comparación biométrica.',
  pt: 'Este é um resultado divertido de estilo e vibe baseado apenas em traços visíveis descritos por escrito. Não é reconhecimento facial, correspondência de identidade nem comparação biométrica.',
  hi: 'यह केवल लिखित रूप से दर्ज दिखाई देने वाले लक्षणों पर आधारित एक मज़ेदार स्टाइल/वाइब परिणाम है। यह चेहरे की पहचान, पहचान का मिलान या बायोमेट्रिक तुलना नहीं है।',
  th: 'นี่คือผลลัพธ์สนุก ๆ ด้านสไตล์และลุคที่อิงจากลักษณะภายนอกที่บันทึกเป็นข้อความเท่านั้น ไม่ใช่การจดจำใบหน้า การจับคู่ตัวตน หรือการเปรียบเทียบไบโอเมตริกซ์',
  zh: '这是一个仅基于书面描述的可见特征得出的趣味风格/气质结果，不是人脸识别、身份匹配或生物特征比对。',
  ja: 'これは書き起こされた見た目の特徴だけに基づく、遊び心のあるスタイル/雰囲気の結果です。顔認識、本人特定、生体情報の比較ではありません。',
};

/** English disclaimer kept as the canonical reference copy. */
export const RESULT_DISCLAIMER = RESULT_DISCLAIMER_BY_LANGUAGE.en;

/** Server-enforced localized no-match fallback message. */
export const NO_MATCH_FALLBACK_BY_LANGUAGE: Record<LanguageCodeValue, string> = {
  en: 'We could not find a confident style/vibe match this time. Try another photo with clearer lighting.',
  ar: 'لم نعثر على تطابق واثق في الأسلوب والانطباع هذه المرة. جرّب صورة أخرى بإضاءة أوضح.',
  it: 'Questa volta non abbiamo trovato un abbinamento di stile e vibe abbastanza sicuro. Prova con un’altra foto con una luce più chiara.',
  fa: 'این بار تطبیق مطمئنی از نظر سبک و حال‌وهوا پیدا نکردیم. عکس دیگری با نور واضح‌تر امتحان کنید.',
  fr: 'Nous n’avons pas trouvé de correspondance de style et de vibe assez sûre cette fois-ci. Essayez une autre photo avec un éclairage plus net.',
  de: 'Diesmal konnten wir keinen sicheren Stil-/Vibe-Treffer finden. Versuche es mit einem anderen Foto bei klarerem Licht.',
  es: 'Esta vez no encontramos una coincidencia de estilo y vibra con suficiente confianza. Prueba con otra foto con mejor iluminación.',
  pt: 'Desta vez não encontramos uma correspondência de estilo e vibe com confiança suficiente. Tente outra foto com iluminação mais clara.',
  hi: 'इस बार हमें स्टाइल/वाइब का कोई भरोसेमंद मिलान नहीं मिला। साफ़ रोशनी वाली कोई दूसरी फ़ोटो आज़माएँ।',
  th: 'ครั้งนี้เราไม่พบการจับคู่สไตล์และลุคที่มั่นใจพอ ลองใช้รูปอื่นที่มีแสงชัดเจนกว่านี้',
  zh: '这次没有找到足够有把握的风格/气质匹配。请换一张光线更清晰的照片试试。',
  ja: '今回は自信を持てるスタイル/雰囲気のマッチが見つかりませんでした。より明るく鮮明な別の写真でお試しください。',
};

/** English fallback kept as the canonical reference copy. */
export const NO_MATCH_FALLBACK_MESSAGE = NO_MATCH_FALLBACK_BY_LANGUAGE.en;
