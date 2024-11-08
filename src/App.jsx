import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import InvoiceGenerator from './pages/InvoiceGenerator'
import InvoiceHistory from './pages/InvoiceHistory'

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<InvoiceGenerator />} />
          <Route path="/history" element={<InvoiceHistory />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </>
  )
}

export default App
