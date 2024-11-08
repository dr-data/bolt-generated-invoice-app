import { Link } from 'react-router-dom'
import { DocumentPlusIcon, ClockIcon } from '@heroicons/react/24/outline'

function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <DocumentPlusIcon className="h-8 w-8 text-primary-500" />
          <span className="text-xl font-semibold text-gray-800">Invoice Generator</span>
        </Link>
        <div className="flex space-x-4">
          <Link 
            to="/" 
            className="flex items-center space-x-1 text-gray-600 hover:text-primary-500 transition"
          >
            <DocumentPlusIcon className="h-5 w-5" />
            <span>New Invoice</span>
          </Link>
          <Link 
            to="/history" 
            className="flex items-center space-x-1 text-gray-600 hover:text-primary-500 transition"
          >
            <ClockIcon className="h-5 w-5" />
            <span>Invoice History</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
