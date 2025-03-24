import * as express from 'express'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const app = express()
const port = process.env.PORT || 3002

const payments = new Map<string, any>()

const webhooks = new Set<string>()

app.use(express.json())

app.use((req, res, next) => {
  console.log(`Provider2 - ${req.method} ${req.url}`)
  next()
})

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', provider: 'provider2' })
})

app.post('/webhooks', (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'Missing webhook URL' })
  }

  webhooks.add(url)
  console.log(`Provider2 - Webhook registered: ${url}`)
  res.status(201).json({ success: true, message: 'Webhook registered successfully' })
})

app.get('/webhooks', (req, res) => {
  res.status(200).json({ webhooks: Array.from(webhooks) })
})

app.delete('/webhooks', (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'Missing webhook URL' })
  }

  if (webhooks.has(url)) {
    webhooks.delete(url)
    console.log(`Provider2 - Webhook removed: ${url}`)
    res.status(200).json({ success: true, message: 'Webhook removed successfully' })
  } else {
    res.status(404).json({ error: 'Webhook URL not found' })
  }
})

async function sendWebhookNotifications(payment: any) {
  const webhookPromises = Array.from(webhooks).map(async url => {
    try {
      console.log(`Provider2 - Sending webhook notification to ${url} for payment ${payment.id}`)
      await axios.post(url, {
        provider: 'provider2',
        event: 'payment.updated',
        data: payment,
        timestamp: new Date().toISOString(),
      })
      return { url, success: true }
    } catch (error) {
      console.error(`Provider2 - Webhook notification failed to ${url}:`, error.message)
      return { url, success: false, error: error.message }
    }
  })

  return Promise.all(webhookPromises)
}

app.post('/charges', (req, res) => {
  const { amount, currency, description, paymentMethod } = req.body

  if (!amount || !currency || !paymentMethod) {
    return res.status(400).json({
      error: 'Missing required fields: amount, currency, or paymentMethod',
    })
  }

  const payment = {
    id: `pay_${uuidv4().substring(0, 10)}`,
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
    console.log(`Provider2 - Payment created: ${payment.id}`)

    if (webhooks.size > 0) {
      await sendWebhookNotifications(payment)
    }

    res.status(201).json(payment)
  }, 300)
})

app.get('/charges/:id', (req, res) => {
  const { id } = req.params
  const payment = payments.get(id)

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' })
  }

  res.status(200).json(payment)
})

app.post('/charges/:id/update-status', (req, res) => {
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

    console.log(`Provider2 - Payment status updated: ${id}, status: ${status}`)
    res.status(200).json(payment)
  }, 100)
})

app.post('/refund/:id', (req, res) => {
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

    console.log(`Provider2 - Payment refunded: ${id}, amount: ${amount}`)
    res.status(200).json(payment)
  }, 150)
})

app.listen(port, () => {
  console.log(`Provider2 mock server running on port ${port}`)
})
