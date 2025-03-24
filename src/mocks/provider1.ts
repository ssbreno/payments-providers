import * as express from 'express'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const app = express()
const port = process.env.PORT || 3001

const payments = new Map<string, any>()

const webhooks = new Set<string>()

app.use(express.json())

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`Provider1 - ${req.method} ${req.url}`)
  next()
})

app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', provider: 'provider1' })
})

app.post('/webhooks', (req: express.Request, res: express.Response) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'Missing webhook URL' })
  }

  webhooks.add(url)
  console.log(`Provider1 - Webhook registered: ${url}`)
  res.status(201).json({ success: true, message: 'Webhook registered successfully' })
})

app.get('/webhooks', (req: express.Request, res: express.Response) => {
  res.status(200).json({ webhooks: Array.from(webhooks) })
})

app.delete('/webhooks', (req: express.Request, res: express.Response) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'Missing webhook URL' })
  }

  if (webhooks.has(url)) {
    webhooks.delete(url)
    console.log(`Provider1 - Webhook removed: ${url}`)
    res.status(200).json({ success: true, message: 'Webhook removed successfully' })
  } else {
    res.status(404).json({ error: 'Webhook URL not found' })
  }
})

async function sendWebhookNotifications(payment: any) {
  const webhookPromises = Array.from(webhooks).map(async url => {
    try {
      console.log(`Provider1 - Sending webhook notification to ${url} for payment ${payment.id}`)
      await axios.post(url, {
        provider: 'provider1',
        event: 'payment.updated',
        data: payment,
        timestamp: new Date().toISOString(),
      })
      return { url, success: true }
    } catch (error) {
      console.error(`Provider1 - Webhook notification failed to ${url}:`, error.message)
      return { url, success: false, error: error.message }
    }
  })

  return Promise.all(webhookPromises)
}

app.post('/charges', (req: express.Request, res: express.Response) => {
  const { amount, currency, description, paymentMethod } = req.body

  if (!amount || !currency || !paymentMethod) {
    return res.status(400).json({
      error: 'Missing required fields: amount, currency, or paymentMethod',
    })
  }

  const payment = {
    id: uuidv4(),
    originalAmount: amount,
    currentAmount: amount,
    currency,
    description,
    status: 'authorized',
    cardId: paymentMethod.card ? `card_${uuidv4().substring(0, 8)}` : undefined,
    createdAt: new Date().toISOString(),
  }

  payments.set(payment.id, payment)

  setTimeout(async () => {
    console.log(`Provider1 - Payment created: ${payment.id}`)

    if (webhooks.size > 0) {
      await sendWebhookNotifications(payment)
    }

    res.status(201).json(payment)
  }, 200)
})

app.get('/charges/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params
  const payment = payments.get(id)

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' })
  }

  res.status(200).json(payment)
})

app.post('/charges/:id/update-status', (req: express.Request, res: express.Response) => {
  const { id } = req.params
  const { status } = req.body
  const payment = payments.get(id)

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' })
  }

  if (!status) {
    return res.status(400).json({ error: 'Missing status' })
  }

  payment.status = status
  payment.updatedAt = new Date().toISOString()
  payments.set(id, payment)

  setTimeout(async () => {
    if (webhooks.size > 0) {
      await sendWebhookNotifications(payment)
    }

    console.log(`Provider1 - Payment status updated: ${id}, status: ${status}`)
    res.status(200).json(payment)
  }, 100)
})

app.post('/refund/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params
  const { amount } = req.body
  const payment = payments.get(id)

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' })
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid refund amount' })
  }

  if (payment.currentAmount < amount) {
    return res.status(400).json({ error: 'Refund amount exceeds available amount' })
  }

  payment.currentAmount -= amount

  if (payment.currentAmount === 0) {
    payment.status = 'refunded'
  } else {
    payment.status = 'partially_refunded'
  }

  payment.updatedAt = new Date().toISOString()
  payments.set(id, payment)

  setTimeout(async () => {
    if (webhooks.size > 0) {
      await sendWebhookNotifications(payment)
    }

    console.log(`Provider1 - Payment refunded: ${id}, amount: ${amount}`)
    res.status(200).json(payment)
  }, 150)
})

app.listen(port, () => {
  console.log(`Provider1 mock server running on port ${port}`)
})
