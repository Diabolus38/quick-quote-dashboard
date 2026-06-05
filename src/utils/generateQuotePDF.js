import { jsPDF } from 'jspdf'

function hexToRgb(hex) {
  const h = (hex || '#166534').replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default async function generateQuotePDF({ lead, client, settings }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 0

  const primaryHex = settings.branding?.pdf_primary_color || settings.branding?.primary_color || '#166534';
  const GREEN = hexToRgb(primaryHex);
  const DARK_GREEN = [13, 31, 18]
  const LIME = [163, 230, 53]
  const WHITE = [255, 255, 255]
  const GRAY_BG = [249, 250, 249]
  const TEXT_DARK = [17, 24, 39]
  const TEXT_MID = [75, 85, 99]
  const TEXT_MUTED = [107, 114, 128]
  const TEXT_LIGHT = [156, 163, 175]
  const BORDER = [229, 231, 235]
  const GREEN_LIGHT_BG = [240, 253, 244]

  function hline(yPos, color) {
    doc.setDrawColor(...(color || BORDER))
    doc.setLineWidth(0.3)
    doc.line(margin, yPos, pageW - margin, yPos)
  }

  function checkPage(needed) {
    if (y + needed > 277) {
      doc.addPage()
      y = 20
    }
  }

  function sectionLabel(text) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text(text.toUpperCase(), margin, y)
    y += 6
  }

  function wrappedText(text, size, color, lineH) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentW)
    lines.forEach(line => {
      checkPage(lineH || 5)
      doc.text(line, margin, y)
      y += lineH || 5
    })
  }

  const answers = typeof lead.answers === 'string' ? JSON.parse(lead.answers || '{}') : (lead.answers || {})
  const pdf = settings.pdf_content || {}
  const pricing = settings.pricing || {}

  // ── HEADER ──
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, 210, 44, 'F')

  const logoUrl = settings.branding?.pdf_logo_url || settings.branding?.logo_url;
  let logoLoaded = false;
  if (logoUrl) {
    try {
      const logoDataUrl = await fetchImageAsBase64(logoUrl);
      const fmt = /jpeg|jpg/i.test(logoDataUrl) ? 'JPEG' : 'PNG';
      doc.addImage(logoDataUrl, fmt, margin, 6, 30, 18);
      logoLoaded = true;
    } catch {}
  }
  if (!logoLoaded) {
    doc.setFillColor(...DARK_GREEN)
    doc.roundedRect(margin, 8, 16, 16, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(168, 240, 192)
    doc.text('Q', margin + 8, 18.5, { align: 'center' })

    doc.setTextColor(...WHITE)
    doc.setFontSize(11)
    doc.text('Quick Quote', margin + 20, 16)
    doc.setFontSize(7)
    doc.setTextColor(...LIME)
    doc.text('360', margin + 20, 21)
  }

  const quoteNum = 'Quote #QQ-' + new Date().getFullYear() + '-' + (lead.id || '0000').toString().slice(-4).toUpperCase()
  const issuedDate = new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const validDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...WHITE)
  doc.text('PROJECT ESTIMATE', pageW - margin, 15, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(200, 230, 200)
  doc.text(quoteNum, pageW - margin, 21, { align: 'right' })
  doc.text('Issued: ' + issuedDate, pageW - margin, 26, { align: 'right' })
  doc.setTextColor(...LIME)
  doc.text('Valid until: ' + validDate, pageW - margin, 31, { align: 'right' })

  y = 52

  // ── CLIENT + COMPANY ──
  const colMid = pageW / 2 + 5
  let leftY = y
  let rightY = y

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('PREPARED FOR', margin, leftY)
  leftY += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_DARK)
  doc.text(lead.name || '—', margin, leftY)
  leftY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_MUTED)
  if (lead.email) { doc.text(lead.email, margin, leftY); leftY += 4 }
  if (lead.phone) { doc.text(lead.phone, margin, leftY); leftY += 4 }
  if (lead.company) { doc.text(lead.company, margin, leftY); leftY += 4 }
  if (lead.municipality) { doc.text(lead.municipality, margin, leftY); leftY += 4 }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('PREPARED BY', colMid, rightY)
  rightY += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_DARK)
  doc.text(client.name || '—', colMid, rightY)
  rightY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_MUTED)
  if (client.email) { doc.text(client.email, colMid, rightY); rightY += 4 }
  if (pdf.phone) { doc.text(pdf.phone, colMid, rightY); rightY += 4 }
  if (client.website_url) { doc.text(client.website_url, colMid, rightY); rightY += 4 }

  y = Math.max(leftY, rightY) + 8
  hline(y)
  y += 6

  // ── INTRODUCTION ──
  if (pdf.introduction_text) {
    sectionLabel('Introduction')
    wrappedText(pdf.introduction_text, 9, TEXT_MID, 4.5)
    y += 4
    hline(y)
    y += 6
  }

  // ── PROJECT SUMMARY ──
  checkPage(40)
  const summaryStartY = y
  sectionLabel('Project Summary')

  const answerMap = [
    { key: 'projectType', label: 'Project Type', map: { new_installation: 'New Installation', renovation: 'Renovation' } },
    { key: 'wastewaterType', label: 'System Type', map: { wc_only: 'WC Only', bdt_only: 'BDT Only', wc_bdt: 'WC + BDT' } },
    { key: 'propertyUsage', label: 'Property Usage', map: { permanent: 'Permanent Residence', holiday_home: 'Holiday Home' } },
    { key: 'households', label: 'Households', map: {} },
    { key: 'installationType', label: 'Installation', map: { above_ground: 'Above Ground', underground: 'Underground' } },
    { key: 'groundConditions', label: 'Ground Conditions', map: { normal_soil: 'Normal Soil', rocky: 'Rocky', high_groundwater: 'High Groundwater', not_sure: 'Not Sure' } },
    { key: 'municipalityPlanning', label: 'Municipality Planning', map: { yes: 'Yes', no: 'No' } },
    { key: 'excavationRequired', label: 'Excavation', map: { yes: 'Yes', no: 'No', not_sure: 'Not Sure' } },
    { key: 'additionalWork', label: 'Additional Work', map: { pump_installation: 'Pump Installation', new_inspection_well: 'New Inspection Well', electrical_installation: 'Electrical Installation', none: 'None' } },
  ]

  const colW = contentW / 3
  let col = 0
  let rowStartY = y

  doc.setFillColor(...GRAY_BG)
  doc.rect(margin - 2, summaryStartY - 4, contentW + 4, 50, 'F')

  answerMap.forEach(item => {
    if (!answers[item.key]) return
    const val = item.map[answers[item.key]] || answers[item.key]
    const cx = margin + col * colW
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text(item.label, cx, rowStartY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_DARK)
    doc.text(String(val), cx, rowStartY + 4)
    col++
    if (col === 3) { col = 0; rowStartY += 14 }
  })

  y = rowStartY + (col > 0 ? 14 : 0) + 8
  hline(y)
  y += 6

  // ── SYSTEM DESCRIPTION ──
  if (pdf.system_description) {
    checkPage(20)
    sectionLabel('System Description')
    wrappedText(pdf.system_description, 9, TEXT_MID, 4.5)
    y += 4
    hline(y)
    y += 6
  }

  // ── PRICE BREAKDOWN ──
  checkPage(20)
  sectionLabel('Price Breakdown')

  const items = [{ label: 'Base wastewater system', amount: 95000 }]
  if (answers.wastewaterType === 'wc_bdt') items.push({ label: 'WC + BDT system', amount: 26000 })
  if (answers.wastewaterType === 'wc_only') items.push({ label: 'WC system', amount: 12000 })
  if (answers.propertyUsage === 'permanent') items.push({ label: 'Permanent residence factor', amount: 8000 })
  if (answers.households === '2') items.push({ label: '2 households', amount: 10000 })
  if (answers.households === '3') items.push({ label: '3 households', amount: 22000 })
  if (answers.households === '4') items.push({ label: '4 households', amount: 34000 })
  if (answers.households === '5') items.push({ label: '5 households', amount: 46000 })
  if (answers.households === '5_plus') items.push({ label: '5+ households', amount: 70000 })
  if (answers.municipalityPlanning === 'yes') items.push({ label: 'Municipality planning assistance', amount: 5000 })
  if (answers.installationType === 'above_ground') items.push({ label: 'Above ground installation', amount: 9000 })
  if (answers.groundConditions === 'rocky') items.push({ label: 'Rocky ground surcharge', amount: 18000 })
  if (answers.groundConditions === 'high_groundwater') items.push({ label: 'High groundwater surcharge', amount: 14000 })
  if (answers.pipeDepth === '2m') items.push({ label: 'Deep pipe (2m)', amount: 7000 })
  if (answers.pipeDepth === '2_5m') items.push({ label: 'Deep pipe (2.5m)', amount: 12000 })
  if (answers.excavationRequired === 'yes') items.push({ label: 'Excavation works', amount: 16000 })
  if (answers.transportHelp === 'yes') items.push({ label: 'Transport', amount: 6000 })
  if (answers.additionalWork === 'pump_installation') items.push({ label: 'Pump installation', amount: 12000 })
  if (answers.additionalWork === 'new_inspection_well') items.push({ label: 'New inspection well', amount: 8000 })
  if (answers.additionalWork === 'electrical_installation') items.push({ label: 'Electrical installation', amount: 9500 })

  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const rotPct = pricing.rot_percentage || 30
  const rotAmount = pricing.rot_enabled ? Math.round(subtotal * rotPct / 100) : 0
  const total = subtotal - rotAmount

  checkPage(8)
  doc.setFillColor(...GRAY_BG)
  doc.rect(margin, y, contentW, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('ITEM', margin + 3, y + 4.5)
  doc.text('AMOUNT', pageW - margin - 3, y + 4.5, { align: 'right' })
  y += 8

  items.forEach((item, i) => {
    checkPage(7)
    if (i % 2 === 1) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 1, contentW, 7, 'F') }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MID)
    doc.text(item.label, margin + 3, y + 4)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...TEXT_DARK)
    doc.text(item.amount.toLocaleString('sv-SE') + ' kr', pageW - margin - 3, y + 4, { align: 'right' })
    y += 7
  })

  checkPage(7)
  hline(y, BORDER)
  y += 4
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('Subtotal', margin + 3, y)
  doc.text(subtotal.toLocaleString('sv-SE') + ' kr', pageW - margin - 3, y, { align: 'right' })
  y += 6

  if (pricing.rot_enabled) {
    checkPage(7)
    doc.setFillColor(...GREEN_LIGHT_BG)
    doc.rect(margin, y - 1, contentW, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...GREEN)
    doc.text('ROT Deduction (' + rotPct + '%)', margin + 3, y + 4)
    doc.text('− ' + rotAmount.toLocaleString('sv-SE') + ' kr', pageW - margin - 3, y + 4, { align: 'right' })
    y += 8
  }

  checkPage(12)
  doc.setFillColor(...GREEN)
  doc.rect(margin, y, contentW, 11, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.text('TOTAL ESTIMATE (INCL. VAT)', margin + 3, y + 7)
  doc.setFontSize(13)
  doc.text(total.toLocaleString('sv-SE') + ' kr', pageW - margin - 3, y + 7.5, { align: 'right' })
  y += 14

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('All prices include VAT. This is a preliminary estimate based on the information provided.', margin, y)
  y += 6
  hline(y)
  y += 6

  // ── SERVICE AGREEMENT ──
  if (pdf.service_agreement) {
    checkPage(20)
    sectionLabel('Service Agreement')
    wrappedText(pdf.service_agreement, 9, TEXT_MID, 4.5)
    y += 4
    hline(y)
    y += 6
  }

  // ── PAYMENT TERMS ──
  checkPage(20)
  sectionLabel('Payment Terms')
  wrappedText(pdf.payment_terms || '50% deposit required upon order confirmation. Remaining 50% due upon project completion. Payment within 10 days of invoice.', 9, TEXT_MID, 4.5)
  y += 4
  hline(y)
  y += 6

  // ── RESERVATIONS ──
  checkPage(30)
  sectionLabel('Important Reservations')
  const reservations = [
    'Obstacles in ground: pipes deeper than 2m, high groundwater, rock or boulders over 500kg',
    'Removal of excess excavated material and final grading not included',
    'Electrical installations not included unless specified above',
    'Price subject to change after site inspection if conditions differ',
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_MUTED)
  reservations.forEach(r => {
    checkPage(5)
    doc.text('— ' + r, margin, y)
    y += 5
  })
  y += 4
  hline(y)
  y += 6

  // ── VALIDITY ──
  checkPage(20)
  const halfW = contentW / 2 - 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('QUOTE VALIDITY', margin, y)
  doc.text('QUESTIONS?', margin + halfW + 10, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MID)
  doc.text('This quote is valid for 60 days from the date of issue.', margin, y)
  doc.text('Do not hesitate to reach out with any', margin + halfW + 10, y)
  y += 4.5
  doc.text('Delivery date: To be agreed upon order confirmation.', margin, y)
  doc.text('questions or to adjust this estimate.', margin + halfW + 10, y)
  y += 8
  hline(y)
  y += 6

  // ── SIGNATURE ──
  checkPage(40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('AUTHORIZED BY', margin, y)
  doc.text('POWERED BY', margin + halfW + 10, y)
  y += 8

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + 60, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_DARK)
  doc.text(pdf.signature_name || client.name || '—', margin, y)
  y += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_LIGHT)
  if (pdf.signature_title) { doc.text(pdf.signature_title, margin, y); y += 4 }
  if (pdf.signature_phone) { doc.text(pdf.signature_phone, margin, y); y += 4 }
  doc.text(pdf.signature_email || client.email || '', margin, y)

  const pwrX = margin + halfW + 10
  const pwrY = y - 20
  doc.setFillColor(...GREEN)
  doc.roundedRect(pwrX, pwrY, 12, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(168, 240, 192)
  doc.text('Q', pwrX + 6, pwrY + 7.5, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_DARK)
  doc.text('Quick Quote 360', pwrX + 15, pwrY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('quickquote360.com', pwrX + 15, pwrY + 9.5)

  if (pdf.disclaimer) {
    y += 10
    checkPage(10)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(...TEXT_LIGHT)
    const dLines = doc.splitTextToSize(pdf.disclaimer, contentW)
    dLines.forEach(l => { doc.text(l, margin, y); y += 4 })
  }

  // ── FOOTER ON ALL PAGES ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    hline(283, BORDER)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text(client.name || '', margin, 287)
    doc.text('quickquote360.com', pageW / 2, 287, { align: 'center' })
    doc.text('Page ' + i + ' of ' + totalPages, pageW - margin, 287, { align: 'right' })
  }

  doc.save('quote-' + (lead.name || 'estimate').replace(/\s+/g, '-').toLowerCase() + '.pdf')
}
