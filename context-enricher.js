export default {
  async fetch(request) {
    const { system = {}, client = {} } = await request.json()

    const country = system.device?.location?.country || 'OTHER'

    const EU = [
      'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR',
      'HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK',
      'SI','ES','SE','IS','LI','NO','GB'
    ]

    let privacy_region
    if (EU.includes(country)) privacy_region = 'eu'
    else if (country === 'US') privacy_region = 'us'
    else if (country === 'CA') privacy_region = 'ca'
    else privacy_region = 'global'

    const consentCookie = system.cookies?.consent || ''
    const hasCookie = Boolean(consentCookie)

    const consent = {}
    if (hasCookie) {
      const parts = Object.fromEntries(
        consentCookie.split(',').map(p => p.split(':'))
      )
      consent.analytics  = parts.analytics  === 'true'
      consent.marketing  = parts.marketing  === 'true'
      consent.preferences= parts.preferences=== 'true'
      consent.necessary  = true
    }

    client.privacy_region   = privacy_region
    client.consent_source   = hasCookie ? 'cookie' : 'default'
    client.consent_version  = '2'
    client.analytics_allowed= hasCookie ? consent.analytics === true : (privacy_region === 'global' || privacy_region === 'us')
    client.marketing_allowed= hasCookie ? consent.marketing === true : (privacy_region === 'global' || privacy_region === 'us')

    return new Response(JSON.stringify({ system, client }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
