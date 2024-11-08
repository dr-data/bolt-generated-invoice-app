import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function InvoiceHistory() {
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    setInvoices(storedInvoices)
  }, [])

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Invoice History</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="px-6 py-5 hover:bg-gray-50 transition duration-150 ease-in-out">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-indigo-600">{invoice.companyName}</h4>
                <p className="mt-1 text-sm text-gray-500">Invoice #{invoice.invoiceNumber}</p>
              </div>
              <div className="flex items-center">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {invoice.currency} {invoice.total.toFixed(2)}
                </span>
                <Link to={`/invoice/${invoice.id}`} className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View Details
                </Link>
              </div>
            </div>
            <div className="mt-2 sm:flex sm:justify-between">
              <div className="sm:flex">
                <p className="flex items-center text-sm text-gray-500">
                  Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
                </p>
                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default InvoiceHistory
