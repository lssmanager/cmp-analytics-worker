export default {
  async fetch(request) {
    const { system, client } = await request.json()

    // Inyectar datos de consentimiento y sesión en el contexto de Zaraz
    // Zaraz los usará automáticamente en TODOS los eventos
    client.privacy_region  = system.device?.location?.country === 'CO' ? 'global' : 'eu'
    client.consent_source  = 'worker'

    return new Response(JSON.stringify({ system, client }))
  }
}
