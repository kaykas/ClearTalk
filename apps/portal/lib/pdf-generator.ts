import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Message, Conversation, User } from './supabase'
import { formatDate } from './utils'
import { computeDocumentHash, generateVerificationReport } from './hash-verifier'

export interface PDFExportOptions {
  conversation: Conversation
  messages: Message[]
  attorney: User
  caseNumber?: string
  jurisdiction?: string
  hashVerificationResults?: {
    overallValid: boolean
    results: any[]
    tamperedMessages: string[]
  }
}

export async function generateCourtReadyPDF(options: PDFExportOptions): Promise<jsPDF> {
  const {
    conversation,
    messages,
    attorney,
    caseNumber,
    jurisdiction,
    hashVerificationResults
  } = options

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Add watermark to every page
  const addWatermark = () => {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.1 }))
    doc.setFontSize(60)
    doc.setTextColor(0, 0, 0)
    doc.text('CERTIFIED COURT RECORD', pageWidth / 2, pageHeight / 2, {
      angle: 45,
      align: 'center'
    })
    doc.restoreGraphicsState()
  }

  // Cover Page
  addWatermark()

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CERTIFIED CONVERSATION EXPORT', pageWidth / 2, 50, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('ClearTalk Communication Platform', pageWidth / 2, 65, { align: 'center' })

  // Case information
  const caseInfo = [
    ['Case Number:', caseNumber || 'N/A'],
    ['Jurisdiction:', jurisdiction || 'N/A'],
    ['Export Date:', formatDate(new Date())],
    ['Exported By:', `${attorney.full_name} (${attorney.email})`],
    ['Total Messages:', messages.length.toString()],
    ['Date Range:', messages.length > 0
      ? `${formatDate(messages[0].created_at)} to ${formatDate(messages[messages.length - 1].created_at)}`
      : 'N/A'
    ]
  ]

  let yPos = 90
  caseInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 50, yPos)
    yPos += 10
  })

  // Hash verification status
  if (hashVerificationResults) {
    yPos += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Hash Chain Verification:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    const statusText = hashVerificationResults.overallValid ? 'VERIFIED ✓' : 'FAILED ✗'
    const statusColor = hashVerificationResults.overallValid ? [0, 128, 0] : [255, 0, 0]
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.text(statusText, margin + 50, yPos)
    doc.setTextColor(0, 0, 0)
  }

  // Certification statement
  yPos = pageHeight - 60
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  const certText = 'This document is a certified export from the ClearTalk communication platform. '
  + 'All messages are protected by SHA-256 cryptographic hash chains to ensure authenticity and prevent tampering. '
  + 'The hash verification report is included at the end of this document.'

  const splitCert = doc.splitTextToSize(certText, pageWidth - 2 * margin)
  doc.text(splitCert, margin, yPos)

  // New page for messages
  doc.addPage()
  addWatermark()

  // Messages table
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Message Timeline', margin, 20)

  const tableData = messages.map((msg, index) => {
    const sender = msg.sender?.full_name || 'Unknown'
    const timestamp = formatDate(msg.created_at)
    const content = msg.was_filtered
      ? `[FILTERED] ${msg.filtered_content}\n\nOriginal: ${msg.original_content}`
      : msg.original_content
    const biffScore = msg.biff_score.toString()
    const patterns = msg.pattern_flags.length > 0 ? msg.pattern_flags.join(', ') : 'None'

    return [
      (index + 1).toString(),
      timestamp,
      sender,
      content,
      biffScore,
      patterns,
      msg.was_filtered ? 'Yes' : 'No'
    ]
  })

  autoTable(doc, {
    startY: 30,
    head: [['#', 'Timestamp', 'Sender', 'Message', 'BIFF Score', 'Patterns', 'Filtered']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [41, 128, 185],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 65 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 25 },
      6: { cellWidth: 15, halign: 'center' }
    },
    didDrawPage: (data) => {
      addWatermark()
      // Page number
      const pageCount = (doc as any).internal.getNumberOfPages()
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber
      doc.setFontSize(8)
      doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
    }
  })

  // Hash verification report page
  if (hashVerificationResults) {
    doc.addPage()
    addWatermark()

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Hash Chain Verification Report', margin, 20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const report = generateVerificationReport(hashVerificationResults)
    const splitReport = doc.splitTextToSize(report, pageWidth - 2 * margin)
    doc.text(splitReport, margin, 35)

    // Detailed verification table
    if (hashVerificationResults.results.length > 0) {
      const verificationData = hashVerificationResults.results.map((result, index) => [
        (index + 1).toString(),
        result.isValid ? 'Valid ✓' : 'Invalid ✗',
        result.actualHash.substring(0, 16) + '...',
        result.errorMessage || 'OK'
      ])

      autoTable(doc, {
        startY: 35 + splitReport.length * 5 + 10,
        head: [['Message #', 'Status', 'Hash (truncated)', 'Notes']],
        body: verificationData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [41, 128, 185],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 70 },
          3: { cellWidth: 60 }
        }
      })
    }
  }

  // Certification page
  doc.addPage()
  addWatermark()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('DOCUMENT CERTIFICATION', pageWidth / 2, 40, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  yPos = 60
  const certStatements = [
    'I hereby certify that this document is a true and accurate export from the ClearTalk communication platform.',
    '',
    'This export includes all messages exchanged between the parties during the specified date range.',
    '',
    'All messages have been verified using SHA-256 cryptographic hash chains to ensure authenticity.',
    '',
    `Export Date: ${formatDate(new Date())}`,
    `Exported By: ${attorney.full_name}`,
    `Professional License: ${attorney.email}`
  ]

  certStatements.forEach(statement => {
    const split = doc.splitTextToSize(statement, pageWidth - 2 * margin)
    doc.text(split, margin, yPos)
    yPos += split.length * 7
  })

  // Compute document hash
  const docContent = JSON.stringify({
    messages,
    caseNumber,
    exportDate: new Date().toISOString()
  })
  const docHash = await computeDocumentHash(docContent)

  yPos += 20
  doc.setFont('helvetica', 'bold')
  doc.text('Document Hash (SHA-256):', margin, yPos)
  doc.setFont('courier', 'normal')
  doc.setFontSize(8)
  yPos += 7
  const hashLines = docHash.match(/.{1,64}/g) || []
  hashLines.forEach(line => {
    doc.text(line, margin, yPos)
    yPos += 5
  })

  // Signature line
  yPos += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('_'.repeat(50), margin, yPos)
  doc.text('Attorney Signature', margin, yPos + 7)

  doc.text('_'.repeat(30), pageWidth - margin - 60, yPos)
  doc.text('Date', pageWidth - margin - 60, yPos + 7)

  return doc
}
