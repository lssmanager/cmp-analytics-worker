/**
 * constants/ga4Config.js - GA4 Configuration & Standard Parameters
 *
 * Definiciones de propiedades estándar de GA4
 * Guía: https://developers.google.com/analytics/devguides/collection/ga4/user-properties
 */

/**
 * GA4 Standard User Properties
 * Estas propiedades se asignan a nivel de usuario y persisten en el tiempo
 */
export const GA4_STANDARD_USER_PROPERTIES = [
  // Financial
  "user_ltv_currency", // Moneda del LTV del usuario
  "user_ltv_revenue", // Ingresos de por vida (custom metric)

  // Demographics
  "user_language", // Idioma del usuario
  "user_country", // País del usuario
  "user_segment", // Segmento personalizado (free, premium, etc.)

  // Subscription/Account
  "subscription_status", // Estado de suscripción
  "subscription_period", // Período de suscripción
  "user_signup_date", // Fecha de registro

  // Custom User Segments
  "account_type", // Tipo de cuenta
  "user_role", // Rol del usuario (student, teacher, admin, etc.)
  "organization_id", // ID de organización
  "plan_level" // Nivel de plan
]

/**
 * GA4 Standard Event Parameters (Common)
 * Parámetros que deben incluirse en TODOS los eventos
 */
export const GA4_REQUIRED_EVENT_PARAMS = [
  "event_name", // Nombre del evento (requerido)
  "timestamp_micros", // Timestamp en microsegundos (requerido)
  "user_pseudo_id", // ID pseudo de usuario (requerido)
  "session_id", // ID de sesión
  "engagement_time_msec" // Tiempo de engagement en milisegundos
]

/**
 * GA4 Standard Item Fields para Ecommerce
 * Cuando se trackean items (productos), estos campos son los estándares
 */
export const GA4_STANDARD_ITEM_FIELDS = {
  // Identificadores (requeridos)
  item_id: "string", // ID del item (requerido)
  item_name: "string", // Nombre del item (requerido)

  // Clasificación
  item_brand: "string", // Marca del item
  item_category: "string", // Categoría principal
  item_category2: "string", // Subcategoría 2
  item_category3: "string", // Subcategoría 3
  item_category4: "string", // Subcategoría 4
  item_category5: "string", // Subcategoría 5
  item_variant: "string", // Variante (color, talla, etc.)

  // Precios
  price: "number", // Precio unitario
  quantity: "number", // Cantidad
  currency: "string", // Código de moneda (ISO 4217)
  discount: "number", // Descuento (adicional)
  tax: "number", // Impuesto

  // Atribución
  affiliation: "string", // Nombre del comerciante/tienda
  coupon: "string", // Código de cupón aplicado al item

  // Contexto de lista
  item_list_id: "string", // ID de la lista de items
  item_list_name: "string", // Nombre de la lista
  item_list_index: "number", // Posición del item en la lista

  // Promoción
  promotion_id: "string", // ID de promoción
  promotion_name: "string", // Nombre de promoción
  creative_name: "string", // Nombre creativo de ad
  creative_slot: "string" // Ubicación de la publicidad
}

/**
 * GA4 Standard Transaction Parameters
 * Parámetros para el evento "purchase" a nivel de transacción
 */
export const GA4_TRANSACTION_PARAMS = {
  transaction_id: "string", // ID único de la transacción (requerido para purchase)
  affiliation: "string", // Nombre del comerciante/tienda
  value: "number", // Valor total de la transacción
  tax: "number", // Impuesto
  shipping: "number", // Costo de envío
  currency: "string", // Código de moneda
  coupon: "string", // Código de cupón en el nivel de transacción
  shipping_tier: "string" // Nivel de envío seleccionado
}

/**
 * GA4 Standard Ecommerce Events
 * Todos los eventos ecommerce estándar de GA4
 */
export const GA4_ECOMMERCE_EVENTS = [
  "view_item", // Usuario visualiza un item
  "view_item_list", // Usuario visualiza una lista de items
  "view_cart", // Usuario visualiza el carrito
  "add_to_cart", // Usuario agrega item al carrito
  "remove_from_cart", // Usuario remueve item del carrito
  "begin_checkout", // Usuario comienza checkout
  "add_shipping_info", // Usuario proporciona info de envío
  "add_payment_info", // Usuario proporciona info de pago
  "purchase", // Usuario completa compra
  "refund", // Se procesa reembolso
  "select_item", // Usuario selecciona un item específico
  "select_promotion", // Usuario selecciona una promoción
  "view_promotion" // Usuario visualiza una promoción
]

/**
 * GA4 Standard User Lifecycle Events
 */
export const GA4_LIFECYCLE_EVENTS = [
  "first_visit", // Primer visit del usuario
  "first_open", // Primera apertura (apps)
  "app_update", // App actualizada
  "login", // Usuario inicia sesión
  "sign_up" // Usuario se registra
]

/**
 * GA4 Standard Engagement Events
 */
export const GA4_ENGAGEMENT_EVENTS = [
  "page_view", // Vista de página
  "scroll", // Usuario hace scroll
  "click", // Usuario hace click en enlace
  "view_search_results", // Usuario ve resultados de búsqueda
  "search", // Usuario realiza búsqueda
  "file_download", // Usuario descarga un archivo
  "video_start", // Video comienza
  "video_progress", // Video en progreso
  "video_complete" // Video completado
]

/**
 * GA4 Standard Form Parameters
 */
export const GA4_FORM_PARAMS = {
  form_id: "string", // ID del formulario
  form_name: "string", // Nombre del formulario
  form_destination: "string", // Donde se envía el formulario
  form_submit_text: "string", // Texto del botón de envío
  form_length: "string", // Largo/complejidad (short, medium, long)
  form_method: "string", // Método (GET, POST, etc)
  form_submit_method: "string" // Método de envío
}

/**
 * GA4 Standard Video Parameters
 */
export const GA4_VIDEO_PARAMS = {
  video_title: "string", // Título del video
  video_url: "string", // URL del video
  video_provider: "string", // Proveedor (YouTube, Vimeo, HTML5, etc)
  video_duration: "number", // Duración total en segundos
  video_current_time: "number", // Tiempo actual en segundos
  video_percent: "number", // Porcentaje completado (0-100)
  video_visible: "boolean", // Si el video es visible
  video_session_id: "string" // ID de sesión del video
}

/**
 * Device & Browser Information
 * Campos de dispositivo y navegador que GA4 captura automáticamente
 * pero que también podemos enviar manualmente
 */
export const GA4_DEVICE_PARAMS = {
  // Screen/Viewport
  screen_resolution: "string", // Ej: "1920x1080"
  viewport_height: "number",
  viewport_width: "number",

  // Browser
  browser: "string", // Chrome, Firefox, Safari, etc
  browser_version: "string",
  language: "string", // Idioma del navegador

  // Device
  device_category: "string", // mobile, tablet, desktop
  mobile_brand_name: "string",
  mobile_model_name: "string",

  // Network
  connection_type: "string", // 4g, wifi, slow-2g, etc
  connection_speed: "string", // Velocidad de conexión

  // OS
  operating_system: "string", // Windows, Mac, Android, iOS
  operating_system_version: "string",

  // Platform
  platform: "string" // web, app
}

/**
 * Campaign & Attribution Parameters
 * Para trackear fuentes de tráfico y campañas
 */
export const GA4_CAMPAIGN_PARAMS = {
  // Google Promote Parameters
  gclid: "string", // Google Click ID
  fbclid: "string", // Facebook Click ID
  gbraid: "string", // Google Broad ID (Web)
  wbraid: "string", // Web Broad ID (Cross-device)

  // UTM Parameters
  utm_source: "string", // Fuente de tráfico
  utm_medium: "string", // Medio (cpc, email, organic, etc)
  utm_campaign: "string", // Nombre de campaña
  utm_content: "string", // Contenido/variante
  utm_term: "string", // Término de búsqueda pago
  utm_source_platform: "string", // Plataforma fuente

  // Referral
  source: "string", // Fuente de tráfico (GA4 estándar)
  medium: "string", // Medio (GA4 estándar)
  campaign: "string" // Campaña (GA4 estándar)
}

/**
 * Learning Platform Events (Custom para Moodle/LMS)
 * No son GA4 estándar pero son importantes para educación
 */
export const LEARNING_PLATFORM_EVENTS = {
  course_enrollment: {
    category: "learning",
    params: ["course_id", "course_name", "enrollment_type", "price"]
  },
  course_completion: {
    category: "learning",
    params: ["course_id", "course_name", "completion_time_seconds"]
  },
  quiz_start: {
    category: "learning",
    params: ["quiz_id", "quiz_name", "course_id", "question_count"]
  },
  quiz_complete: {
    category: "learning",
    params: ["quiz_id", "quiz_name", "score", "total_points", "passing_score"]
  },
  assignment_submit: {
    category: "learning",
    params: ["assignment_id", "assignment_name", "submission_time"]
  },
  lesson_complete: {
    category: "learning",
    params: ["lesson_id", "lesson_name", "time_spent_seconds"]
  }
}

/**
 * Social Platform Events (Custom para BuddyBoss)
 */
export const SOCIAL_PLATFORM_EVENTS = {
  profile_viewed: {
    category: "social",
    params: ["profile_user_id", "viewer_role"]
  },
  profile_updated: {
    category: "social",
    params: ["completion_percentage", "updated_fields"]
  },
  group_joined: {
    category: "social",
    params: ["group_id", "group_name", "group_type", "group_size"]
  },
  group_left: {
    category: "social",
    params: ["group_id", "membership_duration_days"]
  },
  message_sent: {
    category: "social",
    params: ["recipient_user_id", "message_length", "is_group_message", "participant_count"]
  },
  connection_accepted: {
    category: "social",
    params: ["connected_user_id", "total_connections"]
  }
}

/**
 * Default GA4 Configuration
 */
export const GA4_DEFAULT_CONFIG = {
  // Event tracking
  batch_size: 25, // Máximo eventos por batch al GA4 API
  max_batch_delay_ms: 5000, // Máximo delay antes de enviar batch

  // Timeout for GA4 API calls
  ga4_api_timeout_ms: 10000,

  // EU Compliance (GDPR)
  eu_strict_mode: true, // No enviar direct a GA4 sin consentimiento en EU
  ca_strict_mode: true // Canadá también requiere consentimiento

}

/**
 * Map de tipos de datos esperados
 * Para validación de propiedades
 */
export const GA4_DATA_TYPES = {
  string: "string",
  number: "number",
  boolean: "boolean",
  currency: "number", // Special type for money
  timestamp: "number" // Special type for timestamps
}
