import { Link } from 'react-router-dom'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-[1024px] mx-auto px-6">
          <div className="flex justify-between h-20">
            <Link to="/" className="flex items-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1v2h-1v-2zm1-2V9h-1v2h1zm-5-2v2h-2V9h2zm2 0h-1V7h1v2zm1-2v2h-1V7h1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2 text-2xl font-bold tracking-wide text-gray-900">Invoice Generator</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-[1024px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}

export default Layout
