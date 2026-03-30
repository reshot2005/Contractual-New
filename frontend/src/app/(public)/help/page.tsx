import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, Compass, ShieldCheck, CreditCard, LifeBuoy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const revalidate = 600

export default function HelpPage() {
  const categories = [
    { icon: Compass, label: "Getting Started", count: 12 },
    { icon: ShieldCheck, label: "Platform Safety", count: 8 },
    { icon: CreditCard, label: "Payments & Escrow", count: 15 },
    { icon: LifeBuoy, label: "Dispute Support", count: 6 },
  ]

  const faqs = [
    { 
      q: "How does the escrow system work?", 
      a: "When a contract begins, the business deposits the full project amount into our secure digital escrow. Funds are only triggered for release to the freelancer once the business approves the project submission, or after a specific milestone is met." 
    },
    { 
      q: "What is the fee structure?", 
      a: "Contractual charges a flat 10% platform service fee on successful project completions to cover escrow management, moderation, and technical support. There are no hidden subscription fees." 
    },
    { 
      q: "How do I dispute a project submission?", 
      a: "If a submission doesn't meet the agreed criteria and revisions are exhausted, you can click 'Raise Dispute' on the contract page. Our admin team will investigate the contract requirements and submission history to reach a fair resolution." 
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] py-24 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-blue-500 blur-[150px]" />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-teal-500 blur-[150px]" />
        </div>
        
        <div className="relative max-w-2xl mx-auto space-y-6">
          <h1 className="text-5xl font-black tracking-tighter text-white">Support & Resources</h1>
          <p className="text-white/40 font-medium">Clear documentation to help you build, hire, and secure projects.</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input 
              placeholder="Search help articles..." 
              className="h-14 w-full rounded-2xl border-white/10 bg-white/5 pl-12 text-sm font-medium backdrop-blur-xl focus:border-white/20 transition-all shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-20 px-6">
        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {categories.map((c) => (
            <div key={c.label} className="group cursor-pointer rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-white/10">
              <c.icon className="h-6 w-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-black text-white">{c.label}</p>
              <p className="text-[10px] text-white/30 font-bold uppercase mt-1">{c.count} Articles</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-8">
           <h2 className="text-2xl font-black tracking-tight text-white mb-8 border-l-4 border-blue-500 pl-4">Frequently Asked Questions</h2>
           <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/5 bg-white/5 rounded-2xl px-4 overflow-hidden shadow-sm">
                <AccordionTrigger className="text-left text-sm font-bold text-white hover:no-underline py-5 group">
                  <span className="group-hover:text-blue-400 transition-colors uppercase tracking-tight">{faq.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-white/50 text-xs font-medium leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Footer Contact */}
      <div className="max-w-4xl mx-auto pb-20 px-6">
        <div className="rounded-3xl border border-white/5 bg-blue-500/10 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div>
             <h3 className="text-lg font-black text-white">Can't find what you're looking for?</h3>
             <p className="text-sm text-white/40 mt-1">Our support specialists are online waiting to assist you.</p>
           </div>
           <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 h-12 rounded-xl transition-all shadow-xl shadow-blue-500/10">
             Open Support Ticket
           </Button>
        </div>
      </div>
    </div>
  )
}
