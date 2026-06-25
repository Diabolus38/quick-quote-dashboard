export async function ensureClientData(supabase, clientId) {
  let healthy = true;

  try {
    const { data: existingSettings, error: settingsCheckErr } = await supabase
      .from('client_settings')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();

    if (settingsCheckErr) {
      console.error('ensureClientData error:', settingsCheckErr);
      healthy = false;
    } else if (!existingSettings) {
      const { error: settingsInsertErr } = await supabase.from('client_settings').insert({
        client_id:         clientId,
        branding:          {},
        pdf_content:       {},
        email_settings:    {},
        language_settings: {},
      });
      if (settingsInsertErr) {
        console.error('ensureClientData error:', settingsInsertErr);
        healthy = false;
      }
    }
  } catch (err) {
    console.error('ensureClientData error:', err);
    healthy = false;
  }

  try {
    const { data: existingPricing, error: pricingCheckErr } = await supabase
      .from('client_pricing')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();

    if (pricingCheckErr) {
      console.error('ensureClientData error:', pricingCheckErr);
      healthy = false;
    } else if (!existingPricing) {
      const { error: pricingInsertErr } = await supabase.from('client_pricing').insert({
        client_id:       clientId,
        base_prices:     {},
        fixed_costs:     {},
        per_meter_costs: {},
        addons:          {},
        rot_enabled:     false,
        rot_percentage:  30,
        currency:        'SEK',
      });
      if (pricingInsertErr) {
        console.error('ensureClientData error:', pricingInsertErr);
        healthy = false;
      }
    }
  } catch (err) {
    console.error('ensureClientData error:', err);
    healthy = false;
  }

  console.log('ensureClientData completed for client:', clientId, 'healthy:', healthy);
  return healthy;
}
