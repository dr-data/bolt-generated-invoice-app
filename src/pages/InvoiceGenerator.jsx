import React, { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { format, addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { useDropzone } from 'react-dropzone'
import { jsPDF } from "jspdf"
import 'jspdf-autotable'
import EditableField from '../components/EditableField'

const schema = yup.object().shape({
  companyName: yup.string().required('Company name is required'),
  companyAddress: yup.string().required('Company address is required'),
  billTo: yup.string().required('Bill to is required'),
  invoiceNumber: yup.string().required('Invoice number is required'),
  invoiceDate: yup.date().required('Invoice date is required'),
  paymentTerms: yup.string().required('Payment terms are required'),
  dueDate: yup.date().required('Due date is required'),
  items: yup.array().of(
    yup.object().shape({
      description: yup.string().required('Description is required'),
      quantity: yup.number().positive().required('Quantity is required'),
      rate: yup.number().positive().required('Rate is required'),
    })
  ),
  notes: yup.string(),
  termsAndConditions: yup.string(),
  paymentDetails: yup.string(),
})

const currencies = [
  { code: 'HKD', symbol: 'HK$' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
]

function InvoiceGenerator() {
  const [logo, setLogo] = useState(null)
  const [currency, setCurrency] = useState(currencies[0])
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 })
  const [tax, setTax] = useState({ enabled: false, type: 'percentage', value: 0 })
  const [shipping, setShipping] = useState({ enabled: false, value: 0 })
  const [editableFields, setEditableFields] = useState({
    invoiceTitle: 'INVOICE',
    invoiceNumberLabel: 'Invoice Number',
    invoiceDateLabel: 'Invoice Date',
    paymentTermsLabel: 'Payment Terms',
    dueDateLabel: 'Due Date',
    billToLabel: 'Bill To',
    optionalLabel: 'Optional',
    itemLabel: 'Item',
    quantityLabel: 'Quantity',
    rateLabel: 'Rate',
    amountLabel: 'Amount',
    notesLabel: 'Notes',
    termsLabel: 'Terms and Conditions',
    paymentDetailsLabel: 'Payment Details',
    subtotalLabel: 'Subtotal:',
    discountLabel: 'Discount:',
    taxLabel: 'Tax:',
    shippingLabel: 'Shipping:',
    totalLabel: 'Total:',
    balanceDueLabel: 'Balance Due:',
  })

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      items: [{ description: '', quantity: 1, rate: 0 }],
      paymentTerms: '30 Days',
      invoiceNumber: format(new Date(), 'yyyyMMdd'),
      invoiceDate: new Date(),
      dueDate: addDays(new Date(), 30),
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  })

  const invoiceRef = useRef(null)

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      setLogo(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxFiles: 1
  })

  const watchItems = watch('items')
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  
  const calculateDiscount = () => {
    if (discount.type === 'percentage') {
      return subtotal * (discount.value / 100)
    }
    return discount.value
  }

  const calculateTax = () => {
    if (!tax.enabled) return 0
    const taxableAmount = subtotal - calculateDiscount()
    if (tax.type === 'percentage') {
      return taxableAmount * (tax.value / 100)
    }
    return tax.value
  }

  const total = subtotal - calculateDiscount() + calculateTax() + (shipping.enabled ? shipping.value : 0)

  const generatePDF = async (data) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    // Set font
    pdf.setFont('helvetica', 'normal')

    // Add logo
    if (logo) {
      const img = new Image()
      img.src = logo
      const aspectRatio = img.width / img.height
      const maxWidth = 40
      const maxHeight = 40
      let width = maxWidth
      let height = width / aspectRatio
      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }
      pdf.addImage(logo, 'JPEG', 25, 25, width, height)
    }

    // Add invoice title and number
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('INVOICE', 185, 25, { align: 'right' })
    pdf.setFontSize(12)
    pdf.text(`#${data.invoiceNumber}`, 185, 35, { align: 'right' })

    // Add company details
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(data.companyName, 25, 65)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    const companyAddressLines = data.companyAddress.split('\n')
    companyAddressLines.forEach((line, index) => {
      pdf.text(line, 25, 70 + (index * 4))
    })

    // Add invoice details (right-aligned in a group)
    pdf.setFontSize(10)
    const dateX = 140
    const valueX = 185
    const dateFormat = format(data.invoiceDate, 'MMM dd, yyyy')
    const dueDateFormat = format(data.dueDate, 'MMM dd, yyyy')
    
    // Right align labels, left align values
    pdf.text('Date:', dateX, 65, { align: 'right' })
    pdf.text(dateFormat, dateX + 5, 65)
    
    pdf.text('Payment Terms:', dateX, 70, { align: 'right' })
    pdf.text(data.paymentTerms, dateX + 5, 70)
    
    pdf.text('Due Date:', dateX, 75, { align: 'right' })
    pdf.text(dueDateFormat, dateX + 5, 75)

    // Add Balance Due right after Due Date
    pdf.text('Balance Due:', dateX, 80, { align: 'right' })
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${currency.symbol}${total.toFixed(2)}`, valueX, 80, { align: 'right' })
    pdf.setFont('helvetica', 'normal')

    // Add "Bill To" section
    if (data.billTo) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Bill To:', 25, 85)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const billToLines = data.billTo.split('\n')
      billToLines.forEach((line, index) => {
        pdf.text(line, 25, 90 + (index * 4))
      })
    }

    // Add items table
    const tableBody = data.items
      .filter(item => item.description || item.quantity || item.rate)
      .map(item => [
        item.description,
        item.quantity,
        `${currency.symbol}${Number(item.rate).toFixed(2)}`,
        `${currency.symbol}${(item.quantity * item.rate).toFixed(2)}`
      ])

    if (tableBody.length > 0) {
      pdf.autoTable({
        startY: 105,
        head: [[editableFields.itemLabel, editableFields.quantityLabel, editableFields.rateLabel, editableFields.amountLabel]],
        body: tableBody,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'left' },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 30, halign: 'right' }, // Changed to right
          2: { cellWidth: 40, halign: 'right' }, // Changed to right
          3: { cellWidth: 40, halign: 'right' }  // Changed to right
        },
        margin: { left: 25 }
      })
    }

    // Add totals with right alignment
    const finalY = pdf.lastAutoTable.finalY + 3
    let currentY = finalY
    const totalsX = 140
    const amountsX = 185

    // Subtotal
    pdf.text(editableFields.subtotalLabel, totalsX, currentY, { align: 'right' })
    pdf.text(`${currency.symbol}${subtotal.toFixed(2)}`, amountsX, currentY, { align: 'right' })

    // Only show discount if value > 0
    if (discount.value > 0) {
      currentY += 4
      pdf.text(editableFields.discountLabel, totalsX, currentY, { align: 'right' })
      pdf.text(`${currency.symbol}${calculateDiscount().toFixed(2)}`, amountsX, currentY, { align: 'right' })
    }

    // Only show tax if enabled and value > 0
    if (tax.enabled && tax.value > 0) {
      currentY += 4
      pdf.text(editableFields.taxLabel, totalsX, currentY, { align: 'right' })
      pdf.text(`${currency.symbol}${calculateTax().toFixed(2)}`, amountsX, currentY, { align: 'right' })
    }

    // Only show shipping if enabled and value > 0
    if (shipping.enabled && shipping.value > 0) {
      currentY += 4
      pdf.text(editableFields.shippingLabel, totalsX, currentY, { align: 'right' })
      pdf.text(`${currency.symbol}${shipping.value.toFixed(2)}`, amountsX, currentY, { align: 'right' })
    }

    // Total
    currentY += 6
    pdf.setFont('helvetica', 'bold')
    pdf.text(editableFields.totalLabel, totalsX, currentY, { align: 'right' })
    pdf.text(`${currency.symbol}${total.toFixed(2)}`, amountsX, currentY, { align: 'right' })
    pdf.setFont('helvetica', 'normal')

    // Add additional information aligned with items table
    currentY += 15
    const leftMargin = 25

    // Only add sections if they have content
    if (data.notes && data.notes.trim()) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(editableFields.notesLabel, leftMargin, currentY)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const notesLines = data.notes.split('\n')
      notesLines.forEach((line, index) => {
        pdf.text(line, leftMargin, currentY + 5 + (index * 4))
      })
      currentY += 20
    }

    if (data.termsAndConditions && data.termsAndConditions.trim()) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(editableFields.termsLabel, leftMargin, currentY)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const termsLines = data.termsAndConditions.split('\n')
      termsLines.forEach((line, index) => {
        pdf.text(line, leftMargin, currentY + 5 + (index * 4))
      })
      currentY += 20
    }

    if (data.paymentDetails && data.paymentDetails.trim()) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(editableFields.paymentDetailsLabel, leftMargin, currentY)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const paymentLines = data.paymentDetails.split('\n')
      paymentLines.forEach((line, index) => {
        pdf.text(line, leftMargin, currentY + 5 + (index * 4))
      })
    }

    return pdf
  }

  const onSubmit = async (data) => {
    try {
      const pdf = await generatePDF(data)
      pdf.save(`invoice_${data.invoiceNumber}.pdf`)
      toast.success('Invoice generated and downloaded successfully!')
      // Save to local storage
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
      invoices.push({ id: uuidv4(), ...data, total, currency: currency.code })
      localStorage.setItem('invoices', JSON.stringify(invoices))
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  useEffect(() => {
    const paymentTerms = watch('paymentTerms')
    const invoiceDate = watch('invoiceDate')
    if (paymentTerms && invoiceDate) {
      const daysToAdd = parseInt(paymentTerms) || 0
      setValue('dueDate', addDays(invoiceDate, daysToAdd))
    }
  }, [watch('paymentTerms'), watch('invoiceDate'), setValue])

  const handleEditableFieldChange = (field, value) => {
    setEditableFields(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4" ref={invoiceRef}>
      <div className="fixed top-0 right-0 p-4 flex items-center space-x-4 bg-white shadow-md z-10">
        <select
          value={currency.code}
          onChange={(e) => setCurrency(currencies.find(c => c.code === e.target.value))}
          className="form-select w-24"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </select>
        <button onClick={handleSubmit(onSubmit)} className="btn btn-primary">
          Download PDF
        </button>
      </div>

      <div className="flex justify-between items-center mt-16">
        <div {...getRootProps()} className="cursor-pointer hover:border-2 hover:border-gray-200 transition-all duration-200">
          <input {...getInputProps()} />
          {logo ? (
            <img src={logo} alt="Company Logo" className="max-h-32 object-contain" />
          ) : (
            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <EditableField
          value={editableFields.invoiceTitle}
          onSave={(value) => handleEditableFieldChange('invoiceTitle', value)}
          className="text-4xl font-bold tracking-wide text-gray-900"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <input {...register('companyName')} placeholder="Company Name" className="form-input w-full text-lg font-bold" />
            {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>}
            <textarea {...register('companyAddress')} placeholder="Company Address" className="form-input w-full mt-2 h-24" />
            {errors.companyAddress && <p className="text-red-500 text-sm mt-1">{errors.companyAddress.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
          <div>
            <EditableField
              value={editableFields.billToLabel}
              onSave={(value) => handleEditableFieldChange('billToLabel', value)}
              className="text-base font-medium mb-2"
            />
            <textarea {...register('billTo')} placeholder="Client Details" className="form-input w-full h-16" />
            {errors.billTo && <p className="text-red-500 text-sm mt-1">{errors.billTo.message}</p>}
          </div>
          <div>
            <EditableField
              value={editableFields.optionalLabel || "Optional"}
              onSave={(value) => handleEditableFieldChange('optionalLabel', value)}
              className="text-base font-medium mb-2"
            />
            <textarea 
              {...register('optional')} 
              placeholder="(Optional)" 
              className="form-input w-full h-16 placeholder-gray-400" 
            />
          </div>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-4 content-start">
          <EditableField
            value={editableFields.invoiceNumberLabel}
            onSave={(value) => handleEditableFieldChange('invoiceNumberLabel', value)}
            className="text-sm text-gray-500 self-center text-right"
          />
          <input {...register('invoiceNumber')} className="form-input text-sm text-right" />
          
          <EditableField
            value={editableFields.invoiceDateLabel}
            onSave={(value) => handleEditableFieldChange('invoiceDateLabel', value)}
            className="text-sm text-gray-500 self-center text-right"
          />
          <Controller
            control={control}
            name="invoiceDate"
            render={({ field: { onChange, value } }) => (
              <DatePicker
                selected={value}
                onChange={onChange}
                className="form-input text-sm w-full text-right"
              />
            )}
          />
          
          <EditableField
            value={editableFields.paymentTermsLabel}
            onSave={(value) => handleEditableFieldChange('paymentTermsLabel', value)}
            className="text-sm text-gray-500 self-center text-right"
          />
          <input
            {...register('paymentTerms')}
            placeholder="e.g., 30 Days"
            className="form-input text-sm text-right appearance-none" // Added appearance-none
            list="paymentTermsOptions"
          />
          <datalist id="paymentTermsOptions">
            <option value="30 Days" />
            <option value="60 Days" />
            <option value="90 Days" />
          </datalist>
          
          <EditableField
            value={editableFields.dueDateLabel}
            onSave={(value) => handleEditableFieldChange('dueDateLabel', value)}
            className="text-sm text-gray-500 self-center text-right"
          />
          <Controller
            control={control}
            name="dueDate"
            render={({ field: { onChange, value } }) => (
              <DatePicker
                selected={value}
                onChange={onChange}
                className="form-input text-sm w-full text-right"
              />
            )}
          />
        </div>
      </form>

      <div className="bg-slate-800 text-white grid grid-cols-12 gap-4 py-2 px-4 rounded-t-md">
        <EditableField
          value={editableFields.itemLabel}
          onSave={(value) => handleEditableFieldChange('itemLabel', value)}
          className="col-span-6 text-white"
          darkMode={true}
        />
        <EditableField
          value={editableFields.quantityLabel}
          onSave={(value) => handleEditableFieldChange('quantityLabel', value)}
          className="col-span-2 text-right text-white"
          darkMode={true}
        />
        <EditableField
          value={editableFields.rateLabel}
          onSave={(value) => handleEditableFieldChange('rateLabel', value)}
          className="col-span-2 text-right text-white"
          darkMode={true}
        />
        <EditableField
          value={editableFields.amountLabel}
          onSave={(value) => handleEditableFieldChange('amountLabel', value)}
          className="col-span-2 text-right text-white"
          darkMode={true}
        />
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-12 gap-4 py-1 px-4 bg-white even:bg-gray-50 items-center group">
          <div className="col-span-6">
            <textarea 
              {...register(`items.${index}.description`)} 
              placeholder="Item description" 
              className="w-full bg-transparent resize-y min-h-[2.5rem]"
              rows="1"
            />
          </div>
          <div className="col-span-2">
            <input {...register(`items.${index}.quantity`)} type="number" className="w-full text-right bg-transparent" />
          </div>
          <div className="col-span-2">
            <input {...register(`items.${index}.rate`)} type="number" step="0.01" className="w-full text-right bg-transparent" />
          </div>
          <div className="col-span-1 text-right">
            {(watch(`items.${index}.quantity`) * watch(`items.${index}.rate`)).toFixed(2)}
          </div>
          <div className="col-span-1 text-right">
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-sm text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ description: '', quantity: 1, rate: 0 })}
        className="btn btn-outline mt-4"
      >
        + Add Item
      </button>

      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-3 space-y-4">
          <div>
            <EditableField
              value={editableFields.notesLabel}
              onSave={(value) => handleEditableFieldChange('notesLabel', value)}
              className="text-base font-medium mb-2"
            />
            <textarea {...register('notes')} className="form-input w-full h-24" />
          </div>
          <div>
            <EditableField
              value={editableFields.termsLabel}
              onSave={(value) => handleEditableFieldChange('termsLabel', value)}
              className="text-base font-medium mb-2"
            />
            <textarea {...register('termsAndConditions')} className="form-input w-full h-24 " />
          </div>
          <div>
            <EditableField
              value={editableFields.paymentDetailsLabel}
              onSave={(value) => handleEditableFieldChange('paymentDetailsLabel', value)}
              className="text-base font-medium mb-2"
            />
            <textarea {...register('paymentDetails')} className="form-input w-full h-24 " />
          </div>
        </div>

        <div className="col-span-2 space-y-3">
          <div className="flex justify-between">
            <EditableField
              value={editableFields.subtotalLabel}
              onSave={(value) => handleEditableFieldChange('subtotalLabel', value)}
              className="text-sm"
            />
            <span>{currency.symbol} {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center group">
            <EditableField
              value={editableFields.discountLabel}
              onSave={(value) => handleEditableFieldChange('discountLabel', value)}
              className="text-sm"
            />
            <div className="flex items-center">
              <input
                type="number"
                value={discount.value}
                onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                className="form-input w-20 text-right"
              />
              <button
                onClick={() => setDiscount({ ...discount, type: discount.type === 'percentage' ? 'fixed' : 'percentage' })}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                {discount.type === 'percentage' ? '%' : currency.symbol}
              </button>
              <button
                onClick={() => setDiscount({ type: 'percentage', value: 0 })}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
          {!tax.enabled && (
            <button
              onClick={() => setTax({ ...tax, enabled: true })}
              className="text-green-500 hover:text-green-700"
            >
              + Tax
            </button>
          )}
          {tax.enabled && (
            <div className="flex justify-between items-center group">
              <EditableField
                value={editableFields.taxLabel}
                onSave={(value) => handleEditableFieldChange('taxLabel', value)}
                className="text-sm"
              />
              <div className="flex items-center">
                <input
                  type="number"
                  value={tax.value}
                  onChange={(e) => setTax({ ...tax, value: parseFloat(e.target.value) || 0 })}
                  className="form-input w-20 text-right"
                />
                <button
                  onClick={() => setTax({ ...tax, type: tax.type === 'percentage' ? 'fixed' : 'percentage' })}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {tax.type === 'percentage' ? '%' : currency.symbol}
                </button>
                <button
                  onClick={() => setTax({ enabled: false, type: 'percentage', value: 0 })}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {!shipping.enabled && (
            <button
              onClick={() => setShipping({ ...shipping, enabled: true })}
              className="text-green-500 hover:text-green-700"
            >
              + Shipping
            </button>
          )}
          {shipping.enabled && (
            <div className="flex justify-between items-center group">
              <EditableField
                value={editableFields.shippingLabel}
                onSave={(value) => handleEditableFieldChange('shippingLabel', value)}
                className="text-sm"
              />
              <div className="flex items-center">
                <input
                  type="number"
                  value={shipping.value}
                  onChange={(e) => setShipping({ ...shipping, value: parseFloat(e.target.value) || 0 })}
                  className="form-input w-20 text-right"
                />
                <span className="ml-2">{currency.symbol}</span>
                <button
                  onClick={() => setShipping({ enabled: false, value: 0 })}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-3 border-t">
            <EditableField
              value={editableFields.totalLabel}
              onSave={(value) => handleEditableFieldChange('totalLabel', value)}
              className="text-lg font-semibold"
            />
            <span>{currency.symbol} {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <EditableField
              value={editableFields.balanceDueLabel}
              onSave={(value) => handleEditableFieldChange('balanceDueLabel', value)}
              className="text-lg font-semibold"
            />
            <span>{currency.symbol} {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceGenerator
