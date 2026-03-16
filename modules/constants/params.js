export const GA4_STANDARD_ITEM_FIELDS = [
  "item_id",
  "item_name",
  "item_brand",
  "item_category",
  "item_variant",
  "price",
  "quantity",
  "currency"
]

export const BASE_CUSTOM_PARAM_KEYS = [
  "custom_page_type",
  "custom_content_id",
  "custom_content_name",
  "custom_is_first_visit",
  "custom_user_segment"
]

export function sanitizeItems(items = []) {
  if (!Array.isArray(items)) return []
  return items.map(item => {
    const out = {}
    GA4_STANDARD_ITEM_FIELDS.forEach(k => {
      if (item && item[k] != null) out[k] = item[k]
    })
    return out
  }).filter(item => Object.keys(item).length > 0)
}
