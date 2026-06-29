'use server'

import { placeOrder } from '@/actions/orders'
import { isDropExpired } from '@/lib/expiry'

export async function initiatePaymentSession(
  buyerId: string,
  email: string,
  name: string,
  items: { productId: string, price: number, title?: string }[],
  totalAmount: number,
  deliveryDetails: {
    deliveryOption: 'CAMPUS' | 'DOORSTEP'
    address?: string
    city?: string
    state?: string
    pinCode?: string
    landmark?: string
    phone?: string
  }
) {
  if (isDropExpired()) {
    throw new Error('UNAUTHORIZED: THIS EXCLUSIVE DROP HAS ARCHIVED. SECURE CHECKOUT IS DISABLED.')
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  
  const serializedItems = JSON.stringify(items)
  
  // If we have real keys and they are not placeholders, try to generate a real Razorpay Order
  if (keyId && keySecret && !keyId.includes('placeholder') && !keySecret.includes('placeholder')) {
    try {
      console.log('Generating secure Razorpay order_id on backend...')
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
      
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // convert to paise
          currency: 'INR',
          receipt: `receipt_${Date.now().toString().slice(-8)}`,
          notes: {
            buyerId,
            deliveryOption: deliveryDetails.deliveryOption
          }
        })
      })
      
      if (response.ok) {
        const orderData = await response.json()
        if (orderData.id) {
          return {
            orderId: orderData.id,
            keyId: keyId,
            isSimulated: false,
            amount: orderData.amount,
            currency: orderData.currency
          }
        }
      }
      
      console.warn('Razorpay order creation API call was not successful, falling back to simulated portal.')
    } catch (err) {
      console.error('Error creating secure Razorpay order ID:', err)
    }
  }

  // Fallback / local development: simulated checkout redirection
  const queryParams = new URLSearchParams({
    buyerId,
    email,
    name,
    items: serializedItems,
    total: totalAmount.toString(),
    deliveryOption: deliveryDetails.deliveryOption,
    address: deliveryDetails.address || '',
    city: deliveryDetails.city || '',
    state: deliveryDetails.state || '',
    pinCode: deliveryDetails.pinCode || '',
    landmark: deliveryDetails.landmark || '',
    phone: deliveryDetails.phone || ''
  })
  
  return {
    checkoutUrl: `/checkout/razorpay-gateway?${queryParams.toString()}`,
    isSimulated: true
  }
}
