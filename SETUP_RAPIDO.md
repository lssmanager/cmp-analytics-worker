# ✅ CMP Analytics Worker - Captura y Envío GA4 + Zaraz Automático

## Estado Actual

**El worker YA está:**
- ✅ Capturando todos los eventos (lifecycle, web vitals, scroll depth, Moodle, BuddyBoss)
- ✅ Enviando a **GA4 Measurement Protocol API** directamente (via HTTPS POST)
- ✅ Enviando a **Zaraz Monitoring** via sendBeacon
- ✅ Almacenando datos crudos en **Cloudflare KV** (365 días)
- ✅ Anonimizando para EU (respeta GDPR)
- ✅ Preparando datos para entrenar **modelos ML** (Moodle)

---

## 🔄 Flujo de Eventos (Automático)

```
┌─────────────────────────────────────────────────────────────┐
│ USER INTERACTS WITH SITE (WordPress + Moodle + BuddyBoss)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
     ┌─────────────────────────────────────────────┐
     │  SCRIPTS INYECTADOS EN HTML (por worker)    │
     ├─────────────────────────────────────────────┤
     │ ✓ standardEventTrackers.js                  │
     │   - Captura: login, signup, first_visit    │
     │   - Captura: file_download                 │
     │   - Captura: Web Vitals (LCP, FID, INP)   │
     │   - Captura: Scroll Depth (25/50/75/100%) │
     │                                             │
     │ ✓ buddyBossTracker.js                      │
     │   - Captura: profile_viewed                │
     │   - Captura: group_joined                  │
     │   - Captura: activity_posted               │
     │   - Captura: message_sent                  │
     │                                             │
     │ ✓ moodleAdvancedTracker.js                 │
     │   - Captura: quiz_complete                 │
     │   - Captura: course_enrollment             │
     │   - Captura: riesgo (engagement/perform.)  │
     │                                             │
     │ ✓ zarazReporter.js                         │
     │   - Todas las propiedades GA4 estándar    │
     │   - Device, browser, campaign, etc.       │
     └──────────────────────┬──────────────────────┘
                            │
                   sendBeacon POST
                            │
                ┌───────────┴─────────────┐
                │                         │
                ▼                         ▼
    ┌─────────────────────┐    ┌──────────────────────┐
    │  WORKER ENDPOINT    │    │ ZARAZ MONITORING     │
    │  /__cmp/analytics   │    │ (Cloudflare Edge)    │
    └──────────┬──────────┘    └──────────┬───────────┘
               │                          │
    ┌──────────┴──────────┐      ┌────────┴─────────────────┐
    │                     │      │                          │
    ▼                     ▼      ▼                          ▼
┌────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│  KV Store  │  │ GA4 Measurement  │  │  Zaraz Triggers         │
│ (365 días) │  │ Protocol API      │  │  (automático a GA4)    │
│            │  │ (HTTPS POST)      │  │                        │
│ Raw data   │  │                   │  │ • Maps events          │
│ ML-ready   │  │ • Direct send     │  │ • Sets GA4 params     │
│ features   │  │ • Batch 25 events │  │ • Sends via Zaraz tag │
└────────────┘  └─────────┬────────┘  └──────────┬─────────────┘
                          │                       │
                          └───────────┬───────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │  GOOGLE ANALYTICS 4     │
                        ├─────────────────────────┤
                        │ ✓ Real-time Report      │
                        │ ✓ Events Dashboard      │
                        │ ✓ Custom Metrics        │
                        │ ✓ Anomaly Detection     │
                        └─────────────────────────┘
```

---

## 📊 Eventos que Fluyen Automáticamente

### Ciclo de Vida (User Lifecycle)
| Evento | Capturado por | → GA4 | → Zaraz |
|--------|----------|-------|---------|
| `login` | standardEventTrackers | ✅ | ✅ |
| `sign_up` | standardEventTrackers | ✅ | ✅ |
| `first_visit` | standardEventTrackers | ✅ | ✅ |

### Engagement
| Evento | Capturado por | → GA4 | → Zaraz |
|--------|----------|-------|---------|
| `page_view` | zarazReporter + worker | ✅ | ✅ |
| `scroll_depth` (25/50/75/100%) | standardEventTrackers | ✅ | ✅ |
| `click` | zarazReporter | ✅ | ✅ |
| `file_download` | standardEventTrackers | ✅ | ✅ |

### Web Vitals (Desempeño)
| Métrica | Capturada por | Valor | → GA4 |
|---------|----------|-------|-------|
| LCP (Largest Contentful Paint) | Web Vitals Tracker | msecs | ✅ |
| FID (First Input Delay) | Web Vitals Tracker | msecs | ✅ |
| INP (Interaction to Next Paint) | Web Vitals Tracker | msecs | ✅ |
| CLS (Cumulative Layout Shift) | Web Vitals Tracker | score | ✅ |

### Ecommerce (WooCommerce)
| Evento | Capturado por | Parámetros | → GA4 |
|--------|----------|-----------|-------|
| `view_item` | zarazReporter | item_id, name, price | ✅ |
| `add_to_cart` | zarazReporter | item_id, quantity | ✅ |
| `purchase` | zarazReporter | transaction_id, value, tax | ✅ |
| `refund` | worker | transaction_id, reason | ✅ |

### Learning (Moodle)
| Evento | Capturado por | Parámetros | → GA4 |
|--------|----------|-----------|-------|
| `course_enrollment` | learningTracker | course_id, type | ✅ |
| `quiz_complete` | learningTracker | score, total, time | ✅ |
| `moodle_engagement_risk` | moodleAdvancedTracker | risk_level, days_inactive | ✅ |
| `moodle_performance_risk` | moodleAdvancedTracker | grade_trend, failed_count | ✅ |
| `moodle_competency_achieved` | moodleAdvancedTracker | competency_id, date | ✅ |

### Social (BuddyBoss)
| Evento | Capturado por | Parámetros | → GA4 |
|--------|----------|-----------|-------|
| `buddyboss_profile_viewed` | buddyBossTracker | profile_id, viewer_role | ✅ |
| `buddyboss_group_joined` | buddyBossTracker | group_id, group_type | ✅ |
| `buddyboss_activity_posted` | buddyBossTracker | activity_type, mentions | ✅ |
| `buddyboss_message_sent` | buddyBossTracker | recipient_id, length | ✅ |
| `buddyboss_connection_accepted` | buddyBossTracker | user_id, total_connections | ✅ |

---

## 🚀 Cómo Está Funcionando Ahora

### 1. **Worker Captura** (HTML injection)
```javascript
// Cuando carga la página, el worker inyecta:
<script src="standardEventTrackers.js"></script>  // Lifecycle + Web Vitals
<script src="buddyBossTracker.js"></script>       // Social events
<script src="moodleAdvancedTracker.js"></script>  // Learning events
<script src="zarazReporter.js"></script>          // GA4 standard params
```

### 2. **Scripts Capturan Eventos** (en el navegador)
```javascript
// Usuario hace login:
document.dispatchEvent(new CustomEvent("user:authenticated", {
  detail: { authMethod: "password" }
}))

// standardEventTrackers.js recibe y envía:
navigator.sendBeacon("/__cmp/analytics", JSON.stringify({
  type: "login",
  eventName: "login",
  properties: { method: "password" },
  timestamp: 1708000000000
}))
```

### 3. **Worker Procesa** (POST /__cmp/analytics)
```javascript
// analytics.js recibe el evento:
1. ✅ Guarda en KV: events:${id} (365 días)
2. ✅ Construye GA4 payload con ga4MeasurementProtocol.js
3. ✅ Valida estructura GA4
4. ✅ Envía a GA4 API: POST https://www.google-analytics.com/mp/collect
5. ✅ Anonimiza (si es EU)
6. ✅ Zaraz recibe via sendBeacon con todos los parámetros
```

### 4. **GA4 Recibe y Procesa**
```
Google Analytics 4 Dashboard
└─ Real-time Report → VES EVENTOS EN VIVO
```

---

## ⚙️ Configuración Requerida (Simple)

### Paso 1: Obtener GA4 Measurement ID
```
1. Ir a Google Analytics 4
2. Admin → Data Streams
3. Copiar Measurement ID (ej: G-XXXXXXXXXX)
```

### Paso 2: Configurar en wrangler.toml
```toml
[env.production]
vars = {
  GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"  # ← Replace
}
secrets = ["GA4_API_SECRET"]
```

### Paso 3: Crear GA4 API Secret
```bash
wrangler secret put GA4_API_SECRET

# Obtén el secret de:
# Google Analytics → Admin → Data Streams → Measurement Protocol → Create
```

### Paso 4: Deploy
```bash
wrangler deploy
```

### Paso 5: Verificar en GA4
```
1. Abre tu sitio
2. Haz acciones (login, click, descarga archivo)
3. Ve a GA4 → Real-time Report
4. ¡DEBERÍAS VER LOS EVENTOS EN VIVO!
```

---

## 🎯 Configurar Zaraz (Opcional pero Recomendado)

Si quieres que **Zaraz automáticamente maneje los triggers**:

```
Cloudflare Dashboard
└─ Speed → Zaraz
   ├─ Create Tag: "Google Analytics 4"
   │  └─ Measurement ID: G-XXXXXXXXXX
   │
   └─ Create Triggers (usar zaras-config.json):
      ├─ Trigger: Login → GA4 login
      ├─ Trigger: Page View → GA4 page_view
      ├─ Trigger: Scroll → GA4 scroll
      ├─ Trigger: Purchase → GA4 purchase
      └─ ... (ver zaras-config.json para todos)
```

**Resultado**: Los eventos fluyen automáticamente a GA4 sin código adicional.

---

## 📋 Checklist de Activación

- [ ] GA4_MEASUREMENT_ID obtenido
- [ ] GA4_MEASUREMENT_ID en wrangler.toml
- [ ] GA4_API_SECRET creado y configurado
- [ ] Worker desplegado (`wrangler deploy`)
- [ ] Prueba: Abrir sitio y hacer acciones
- [ ] GA4 Real-time Report muestra eventos
- [ ] (Opcional) Zaraz GA4 tag creado
- [ ] (Opcional) Zaraz triggers importados

---

## 📊 Dashboard Analytics

Una vez desplegado, accede a estos endpoints:

```bash
# Ver estudiantes en riesgo (Moodle)
curl https://your-domain.com/api/analytics/moodle/COURSE_ID

# Exportar datos ML para entrenar modelos
curl https://your-domain.com/api/analytics/ml/dataset?format=jsonl

# Validar configuración GA4
curl https://your-domain.com/api/analytics/validate-ga4
```

---

## 🆘 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| No veo eventos en GA4 | Verifica GA4_MEASUREMENT_ID en wrangler.toml |
| Errores en consola | Revisa sintaxis en zarazReporter.js |
| Zaraz no envía a GA4 | Crea GA4 tag en Zaraz dashboard con Measurement ID |
| EU anonymización no funciona | Worker valida automáticamente (no requiere config) |
| ML dataset vacío | Espera 24h para que Moodle genere eventos |

---

## ✨ Lo que sigue

1. **Dashboard Personalizado**: Crea reportes en GA4 con los eventos
2. **Alertas**: Configura alertas para "moodle_engagement_risk" alto
3. **ML Training**: Usa `/api/analytics/ml/dataset` para entrenar modelos
4. **BI Reports**: Conecta Looker/Tableau a GA4
5. **A/B Testing**: Usa GA4 experiments con los eventos

---

**Estado**: ✅ Completamente automático
**Próximo paso**: Desplegar y abrir GA4 Real-time Report
**Tiempo para ver eventos**: 2-5 segundos después de acciones
