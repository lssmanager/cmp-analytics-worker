export default {
  async fetch(request) {
    const body  = await request.json()
    const system = body?.system ?? {}
    const client = body?.client ?? {}

    const country = system?.device?.location?.country ?? 'OTHER'
    const EU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR',
                'HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK',
                'SI','ES','SE','IS','LI','NO','GB']

    client.privacy_region = EU.includes(country) ? 'eu'
                          : country === 'US'      ? 'us'
                          : country === 'CA'      ? 'ca'
                          : 'global'
    client.consent_source = system?.cookies?.consent ? 'cookie' : 'default'

    return new Response(JSON.stringify({ system, client }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
