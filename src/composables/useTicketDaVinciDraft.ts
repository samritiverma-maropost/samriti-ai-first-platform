import { ref } from 'vue'
import type { DvToolStep } from '@/components/copilot/DvToolSteps.vue'
import type { Ticket } from '@/stores/useTickets'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function firstCustomerMessage(ticket: Ticket): string {
  return ticket.thread.find((m) => m.role === 'customer')?.body ?? ''
}

function orderRefFromThread(body: string): string | null {
  const match = body.match(/#(\d{5,})/)
  return match ? `#${match[1]}` : null
}

export function useTicketDaVinciDraft() {
  const generating = ref(false)
  const steps = ref<DvToolStep[]>([])

  async function generateReplyDraft(ticket: Ticket): Promise<string> {
    generating.value = true
    steps.value = [
      { label: 'Reading the ticket thread', status: 'running' },
      { label: 'Checking customer orders', status: 'pending' },
      { label: 'Drafting a reply', status: 'pending' },
    ]
    await sleep(450)
    steps.value = [
      { label: 'Reading the ticket thread', status: 'done' },
      { label: 'Checking customer orders', status: 'running' },
      { label: 'Drafting a reply', status: 'pending' },
    ]
    await sleep(500)
    steps.value = [
      { label: 'Reading the ticket thread', status: 'done' },
      { label: 'Checking customer orders', status: 'done' },
      { label: 'Drafting a reply', status: 'running' },
    ]
    await sleep(550)

    const customerFirst = ticket.customer.split(/\s+/)[0] || 'there'
    const threadBody = firstCustomerMessage(ticket)
    const orderRef = orderRefFromThread(threadBody)
    const subjectHint = ticket.subject.replace(/\.$/, '').toLowerCase()

    let middle = `Thank you for reaching out about ${subjectHint}.`
    if (orderRef) {
      middle += ` I've pulled up ${orderRef} and can see why this would be frustrating.`
      middle += ` I'm checking the refund and promo-code application on our side now and will follow up with the exact status shortly.`
    } else {
      middle += ` I'm reviewing the details on our side and will get back to you with next steps shortly.`
    }

    const draft = `Hi ${customerFirst},\n\n${middle}\n\nPlease reply here if anything else comes up.`

    steps.value = steps.value.map((s) => ({ ...s, status: 'done' as const }))
    generating.value = false
    return draft
  }

  function reset() {
    generating.value = false
    steps.value = []
  }

  return { generating, steps, generateReplyDraft, reset }
}
