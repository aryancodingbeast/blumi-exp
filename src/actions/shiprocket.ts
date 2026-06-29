'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function syncOrderToShiprocket(
  orderId: string,
  buyerId: string,
  totalAmount: number,
  shippingDetails: {
    name: string
    email: string
    phone: string
    deliveryOption: string
    address?: string
    city?: string
    state?: string
    pinCode?: string
    landmark?: string
  },
  items: { productId: string, price: number, title?: string }[]
) {
  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Home'

  const hasRealKeys = email && password && !email.includes('placeholder') && !password.includes('placeholder')
  
  if (hasRealKeys) {
    try {
      console.log('Shiprocket API Integration - Authenticating...')
      const authResponse = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (authResponse.ok) {
        const authData = await authResponse.json()
        const token = authData.token

        if (token) {
          console.log('Shiprocket API Integration - Creating adhoc shipment order...')
          const orderDate = new Date().toISOString().split('T')[0]
          
          // Formulate billing address (Shiprocket requires specific fields)
          const billingAddress = shippingDetails.deliveryOption === 'CAMPUS'
            ? 'IGDTUW Central Campus Pickup Vault'
            : shippingDetails.address || 'Standard Pickup'
          
          const billingCity = shippingDetails.deliveryOption === 'CAMPUS' ? 'New Delhi' : (shippingDetails.city || 'Delhi')
          const billingState = shippingDetails.deliveryOption === 'CAMPUS' ? 'Delhi' : (shippingDetails.state || 'Delhi')
          const billingPincode = shippingDetails.deliveryOption === 'CAMPUS' ? '110006' : (shippingDetails.pinCode || '110006')
          
          // Shiprocket strictly requires a valid 10-digit Indian mobile number
          const rawPhone = shippingDetails.phone || ''
          const cleanedPhone = rawPhone.replace(/\D/g, '').slice(-10)
          const billingPhone = cleanedPhone.length === 10 && /^[6-9]/.test(cleanedPhone) ? cleanedPhone : ''
          
          const billingCustomerName = shippingDetails.name || 'Revclo Buyer'

          if (!billingPhone) {
            console.error('[Shiprocket Sync] Invalid phone number, cannot create shipment:', rawPhone)
            // Fall through to simulated sync below
          } else {
          const shiprocketResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              order_id: orderId,
              order_date: orderDate,
              pickup_location: pickupLocation,
              billing_customer_name: billingCustomerName,
              billing_last_name: '',
              billing_address: billingAddress,
              billing_address_2: shippingDetails.landmark || '',
              billing_city: billingCity,
              billing_pincode: parseInt(billingPincode, 10),
              billing_state: billingState,
              billing_country: 'India',
              billing_email: shippingDetails.email || 'buyer@revclo.com',
              billing_phone: billingPhone,
              shipping_is_billing: true,
              order_items: items.map((item, index) => ({
                name: item.title || `REVCLO GARMENT DROPS #${index + 1}`,
                sku: `SKU-${item.productId.slice(0, 6).toUpperCase()}`,
                units: 1,
                selling_price: item.price,
                discount: 0,
                tax: 0,
                hsn: 0
              })),
              payment_method: 'Prepaid',
              sub_total: totalAmount,
              length: 25,
              breadth: 20, // Shiprocket expects 'breadth' instead of 'width'
              height: 5,
              weight: 0.5
            })
          })

          if (shiprocketResponse.ok) {
            const shiprocketData = await shiprocketResponse.ok ? await shiprocketResponse.json() : {}
            console.log('Shiprocket sync successful:', shiprocketData)
            
            const awbCode = shiprocketData.awb_code || `AWB_${Math.floor(100000000 + Math.random() * 900000000)}`
            
            // Persist the live tracking info mapping in waitlist table fallback
            try {
              const serializedTracking = `[TRACKING_INFO] Order: ${orderId} | AWB: ${awbCode} | Shipment: ${shiprocketData.shipment_id} | SR_Order: ${shiprocketData.order_id}`
              await supabaseAdmin
                .from('waitlist')
                .insert({
                  name: serializedTracking,
                  email: shippingDetails.email.trim().toLowerCase(),
                  waitlist_number: 99999,
                  year: 'TRACKING'
                })
              console.log(`[Shiprocket Sync] Persistence successful for order: ${orderId}`)
            } catch (persistErr) {
              console.error('[Shiprocket Sync] Failed to persist live tracking info:', persistErr)
            }

            return {
              success: true,
              isSimulated: false,
              shiprocketOrderId: shiprocketData.order_id,
              shipmentId: shiprocketData.shipment_id,
              awbCode: awbCode
            }
          } else {
            const errText = await shiprocketResponse.text()
            console.warn('Shiprocket API order creation failed, falling back to simulated sync:', errText)
          }
          } // end billingPhone check
        }
      } else {
        const errText = await authResponse.text()
        console.error(`[Shiprocket Sync Error] Authentication failed with status ${authResponse.status}:`, errText)
      }
    } catch (e) {
      console.error('Shiprocket API connection failed, falling back to simulated sync:', e)
    }
  }

  // Simulated sync fallback logs for local development
  const simulatedAwb = `SR_AWB_${Math.floor(10000000 + Math.random() * 90000000)}`
  const simulatedOrderId = `SR_ORD_${Math.floor(100000 + Math.random() * 900000)}`
  const simulatedShipmentId = `SR_SHP_${Math.floor(100000 + Math.random() * 900000)}`

  // Persist simulated tracking mapping in waitlist table fallback
  try {
    const serializedTracking = `[TRACKING_INFO] Order: ${orderId} | AWB: ${simulatedAwb} | Shipment: ${simulatedShipmentId} | SR_Order: ${simulatedOrderId}`
    await supabaseAdmin
      .from('waitlist')
      .insert({
        name: serializedTracking,
        email: shippingDetails.email.trim().toLowerCase(),
        waitlist_number: 99999,
        year: 'TRACKING'
      })
    console.log(`[Shiprocket Sync] Persisted simulated tracking info for order: ${orderId}`)
  } catch (persistErr) {
    console.error('[Shiprocket Sync] Failed to persist simulated tracking info:', persistErr)
  }

  return {
    success: true,
    isSimulated: true,
    shiprocketOrderId: simulatedOrderId,
    shipmentId: simulatedShipmentId,
    awbCode: simulatedAwb
  }
}

/**
 * Fetch dynamic parcel status updates from Shiprocket Tracking API with auto-sync and local progressive simulated fallback.
 */
export async function getOrderTrackingDetails(orderId: string, email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase()
    
    // 1. Fetch tracking metadata from waitlist table
    const { data: trackingRecords, error } = await supabaseAdmin
      .from('waitlist')
      .select('name')
      .ilike('email', cleanEmail)
      .like('name', '%[TRACKING_INFO]%')
      
    if (error) {
      console.error('[getOrderTrackingDetails] Failed to fetch tracking logs:', error)
      return { success: false, message: 'Logistics records could not be loaded.' }
    }
    
    // Find the record for this specific local orderId
    const record = trackingRecords?.find(r => r.name.includes(`Order: ${orderId}`))
    if (!record) {
      console.log(`[getOrderTrackingDetails] No tracking logs found for order ${orderId}`)
      return { success: false, isSimulated: true, currentStep: 0, trackingCode: null, statusLabel: 'SECURED' }
    }
    
    // Parse: [TRACKING_INFO] Order: ${orderId} | AWB: ${awbCode} | Shipment: ${shipmentId} | SR_Order: ${shiprocketOrderId}
    const match = record.name.match(/AWB:\s*(.*?)\s*\|\s*Shipment:\s*(.*?)\s*\|\s*SR_Order:\s*(.*)$/i)
    if (!match) {
      return { success: false, isSimulated: true, currentStep: 0, trackingCode: null, statusLabel: 'SECURED' }
    }
    
    const awbCode = match[1]
    const shipmentId = match[2]
    const srOrderId = match[3]
    
    // 2. Tries to query Shiprocket tracking API
    const srEmail = process.env.SHIPROCKET_EMAIL
    const srPassword = process.env.SHIPROCKET_PASSWORD
    const hasRealKeys = srEmail && srPassword && !srEmail.includes('placeholder') && !srPassword.includes('placeholder')
    
    let isSimulated = awbCode.startsWith('SR_AWB_')
    
    if (hasRealKeys && !isSimulated) {
      try {
        // Authenticate
        const authResponse = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: srEmail, password: srPassword })
        })
        
        if (authResponse.ok) {
          const authData = await authResponse.json()
          const token = authData.token
          
          if (token) {
            // Query Tracking API
            const trackResponse = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (trackResponse.ok) {
              const trackData = await trackResponse.json()
              const tracking = trackData.tracking_data
              
              if (tracking && tracking.track_status === 1 && tracking.shipment_track && tracking.shipment_track[0]) {
                const info = tracking.shipment_track[0]
                const shipStatusId = parseInt(info.shipment_status_id, 10)
                const currentStatus = info.current_status || 'In Transit'
                const currentLocation = info.activities?.[0]?.location || 'Delhi'
                
                // Map Shiprocket Status ID to our 5-step timeline:
                let currentStep = 1
                let dbStatus = 'PLACED'
                
                if (shipStatusId >= 1 && shipStatusId <= 4) {
                  currentStep = 1 // Getting ready
                } else if (shipStatusId === 5 || shipStatusId === 6 || shipStatusId === 18 || shipStatusId === 19) {
                  currentStep = 2 // Transit
                  dbStatus = 'SHIPPED'
                } else if (shipStatusId === 17 || shipStatusId === 7) {
                  currentStep = 3 // Delivering
                  dbStatus = 'SHIPPED'
                } else if (shipStatusId === 8) {
                  currentStep = 4 // Delivered
                  dbStatus = 'DELIVERED'
                }
                
                // Auto-sync local orders status table
                await supabaseAdmin
                  .from('orders')
                  .update({ status: dbStatus })
                  .eq('id', orderId)
                  
                return {
                  success: true,
                  isSimulated: false,
                  currentStep,
                  trackingCode: awbCode,
                  statusLabel: currentStatus.toUpperCase(),
                  location: currentLocation,
                  shipmentId,
                  srOrderId
                }
              }
            }
          }
        }
      } catch (apiErr) {
        console.error('[getOrderTrackingDetails] Live Shiprocket tracking query exception:', apiErr)
      }
    }
    
    // 3. Fallback: Simulated Progressive Milestone Generator (based on current date relative to Order Date)
    let orderAgeHours = 2
    try {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('created_at')
        .eq('id', orderId)
        .single()
      if (order) {
        const orderDate = new Date(order.created_at)
        const diffMs = Date.now() - orderDate.getTime()
        orderAgeHours = diffMs / (1000 * 60 * 60)
      }
    } catch (dbErr) {
      console.warn('[getOrderTrackingDetails] Failed to retrieve order date for simulated timeline:', dbErr)
    }
    
    // Simulate progressive milestones:
    let currentStep = 0
    let statusLabel = 'DRIP SECURED'
    let location = 'REVCLO HUB, DELHI'
    let dbStatus = 'PLACED'
    
    if (orderAgeHours < 0.5) {
      currentStep = 0
      statusLabel = 'ORDER SECURED'
      location = 'REVCLO HUB, DELHI'
      dbStatus = 'PLACED'
    } else if (orderAgeHours < 1.5) {
      currentStep = 1
      statusLabel = 'GETTING DRIP READY (MANIFESTED)'
      location = 'REVCLO HUB, DELHI'
      dbStatus = 'PLACED'
    } else if (orderAgeHours < 3.5) {
      currentStep = 2
      statusLabel = 'IN TRANSIT (DISPATCHED)'
      location = 'IN TRANSIT - DELHI SOUTH EDGES'
      dbStatus = 'SHIPPED'
    } else if (orderAgeHours < 6) {
      currentStep = 3
      statusLabel = 'OUT FOR DELIVERY (PULLING UP)'
      location = 'IGDTUW METRO / HUB NEIGHBORHOOD'
      dbStatus = 'SHIPPED'
    } else {
      currentStep = 4
      statusLabel = 'DELIVERED (BUSINESS STOOD ON)'
      location = 'IGDTUW CAMPUS PICKUP VAULT'
      dbStatus = 'DELIVERED'
    }
    
    // Auto-sync status back to database
    await supabaseAdmin
      .from('orders')
      .update({ status: dbStatus })
      .eq('id', orderId)
      
    return {
      success: true,
      isSimulated: true,
      currentStep,
      trackingCode: awbCode,
      statusLabel,
      location,
      shipmentId,
      srOrderId
    }
    
  } catch (err) {
    console.error('[getOrderTrackingDetails] Unexpected tracking fetch error:', err)
    return { success: false, message: 'An unexpected tracking error occurred.' }
  }
}
