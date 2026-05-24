import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app  = express();
const PORT = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());

app.get('/config/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params

    const [
      { data: client },
      { data: settings },
      { data: pricing },
      { data: municipalities },
      { data: questions }
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('client_settings').select('*').eq('client_id', clientId).single(),
      supabase.from('client_pricing').select('*').eq('client_id', clientId).single(),
      supabase.from('client_municipalities').select('*').eq('client_id', clientId),
      supabase.from('client_questions').select('*').eq('client_id', clientId).eq('visible', true)
    ])

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json({
      client: {
        name: client.name,
        email: client.email,
        plan: client.plan,
        active: client.active
      },
      branding: settings?.branding || {},
      pricing: {
        base_prices: pricing?.base_prices || {},
        fixed_costs: pricing?.fixed_costs || {},
        per_meter_costs: pricing?.per_meter_costs || {},
        addons: pricing?.addons || {},
        rot_enabled: pricing?.rot_enabled || false,
        rot_percentage: pricing?.rot_percentage || 30,
        currency: pricing?.currency || 'SEK'
      },
      municipalities: municipalities || [],
      questions: questions || [],
      pdf_content: settings?.pdf_content || {},
      email_settings: settings?.email_settings || {}
    })
  } catch (err) {
    console.error('Config API error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
