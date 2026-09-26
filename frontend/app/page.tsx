import { getCategories, getServices, getFaq, getPortfolio } from '@/lib/api'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Portfolio from '@/components/Portfolio'
import Faq from '@/components/Faq'
import Contacts from '@/components/Contacts'
import Footer from '@/components/Footer'

export default async function Page() {
  const [categories, services, faqItems, portfolioItems] = await Promise.all([
    getCategories(),
    getServices(),
    getFaq(),
    getPortfolio(),
  ])

  return (
    <>
      <Header />
      <main className="pt-[72px]">
        <Hero />
        <Services categories={categories} services={services} />
        <Portfolio items={portfolioItems} />
        <Faq items={faqItems} />
        <Contacts />
      </main>
      <Footer />
    </>
  )
}
