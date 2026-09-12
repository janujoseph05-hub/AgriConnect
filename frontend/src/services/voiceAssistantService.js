import { getListings, getDeliveries, getBuyerPurchaseRequests, getReceivedPurchaseRequests } from './api'
import { getAllCropOpportunities } from '../utils/cropOpportunityEngine'

/**
 * Voice Assistant Intent Processor for AgriConnect
 * Connected to live backend APIs and Crop Opportunity Engine.
 */
export async function processVoiceQuery(queryText, lang = 'en', user = null) {
  const text = queryText.toLowerCase().trim()

  if (!text) {
    return lang === 'ta'
      ? 'தயவுசெய்து உங்கள் கேள்வியைக் கேட்கவும்.'
      : 'Please state your question.'
  }

  // 1. Crop Opportunity queries
  if (
    text.includes('grow') ||
    text.includes('opportunity') ||
    text.includes('plant') ||
    text.includes('recommend') ||
    text.includes('what should i') ||
    text.includes('பயிரிடலாம்') ||
    text.includes('பயிர்') ||
    text.includes('வாய்ப்பு')
  ) {
    const opps = getAllCropOpportunities()
    const sorted = [...opps].sort((a, b) => b.opportunityScore - a.opportunityScore)
    const top1 = sorted[0]
    const top2 = sorted[1]

    if (lang === 'ta') {
      return `AgriConnect சந்தை தரவுகளின்படி, ${top1.crop} (மதிப்பெண்: ${top1.opportunityScore}) மற்றும் ${top2.crop} (மதிப்பெண்: ${top2.opportunityScore}) அதிக வாய்ப்பைக் கொண்டுள்ளன. ${top1.crop}: ${top1.recommendedAction}`
    }
    return `Based on AgriConnect market indicators, ${top1.crop} (Score: ${top1.opportunityScore}/100) and ${top2.crop} (Score: ${top2.opportunityScore}/100) offer the best opportunity right now. Recommendation: ${top1.recommendedAction}`
  }

  // 2. Marketplace Listing queries (Tomatoes, Onions, Bananas, Carrots, Paddy)
  if (
    text.includes('available') ||
    text.includes('how much') ||
    text.includes('find') ||
    text.includes('selling') ||
    text.includes('listing') ||
    text.includes('market') ||
    text.includes('கிடைக்கிறதா') ||
    text.includes('காட்டு') ||
    text.includes('எவ்வளவு') ||
    text.includes('விற்கும்')
  ) {
    try {
      const listings = await getListings()
      let cropSearch = null

      if (text.includes('tomato') || text.includes('தக்காளி')) cropSearch = 'tomato'
      else if (text.includes('onion') || text.includes('வெங்காயம்')) cropSearch = 'onion'
      else if (text.includes('banana') || text.includes('வாழை')) cropSearch = 'banana'
      else if (text.includes('carrot') || text.includes('கேரட்')) cropSearch = 'carrot'
      else if (text.includes('paddy') || text.includes('rice') || text.includes('நல்')) cropSearch = 'paddy'

      if (cropSearch) {
        const matches = listings.filter((l) =>
          l.crop_name.toLowerCase().includes(cropSearch)
        )
        const totalQty = matches.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        const farmers = [...new Set(matches.map((m) => m.farmer_name || m.source_name))].filter(Boolean)

        if (matches.length > 0) {
          const cropDisplay = matches[0].crop_name
          if (lang === 'ta') {
            return `AgriConnect சந்தையில் ${cropDisplay} க்கான ${matches.length} பதிவுகள் உள்ளன. மொத்தம் ${totalQty.toLocaleString()} ${matches[0].unit || 'kg'} கிடைக்கிறது. விற்பனையாளர்கள்: ${farmers.slice(0, 3).join(', ')}.`
          }
          return `We have ${matches.length} listing(s) for ${cropDisplay} with total ${totalQty.toLocaleString()} ${matches[0].unit || 'kg'} available on AgriConnect. Sellers include: ${farmers.slice(0, 3).join(', ')}.`
        } else {
          if (lang === 'ta') {
            return `தற்போது AgriConnect சந்தையில் ${cropSearch} க்கான பதிவுகள் எதுவும் கிடைக்கவில்லை.`
          }
          return `Currently there are no active marketplace listings for ${cropSearch} in AgriConnect.`
        }
      } else {
        // General marketplace overview
        if (lang === 'ta') {
          return `AgriConnect சந்தையில் தற்போது மொத்தம் ${listings.length} விளைபொருள் பதிவுகள் உள்ளன.`
        }
        return `AgriConnect currently has ${listings.length} active produce listings available in the marketplace.`
      }
    } catch {
      // Fallback if network issue
    }
  }

  // 3. Delivery status queries
  if (
    text.includes('delivery') ||
    text.includes('status') ||
    text.includes('shipment') ||
    text.includes('logistics') ||
    text.includes('டெலிவரி') ||
    text.includes('நிலை')
  ) {
    if (!user) {
      return lang === 'ta'
        ? 'உங்கள் டெலிவரி நிலையைக் காண AgriConnect இல் உள்நுழையவும்.'
        : 'Please log in to AgriConnect to view your delivery status.'
    }
    try {
      const deliveries = await getDeliveries()
      if (!deliveries || deliveries.length === 0) {
        return lang === 'ta'
          ? 'உங்களிடம் தற்போது செயலில் உள்ள டெலிவரிகள் எதுவும் இல்லை.'
          : 'You currently have no active deliveries in AgriConnect.'
      }
      const latest = deliveries[0]
      if (lang === 'ta') {
        return `உங்களிடம் ${deliveries.length} டெலிவரி(கள்) உள்ளன. சமீபத்திய டெலிவரி #${latest.id} (${latest.crop_name}) நிலை: '${latest.status}'.`
      }
      return `You have ${deliveries.length} delivery shipment(s). Latest shipment #${latest.id} for ${latest.crop_name} status is '${latest.status}'.`
    } catch {
      return lang === 'ta'
        ? 'டெலிவரி தகவலைப் பெற முடியவில்லை.'
        : 'Unable to fetch delivery information at this time.'
    }
  }

  // 4. Purchase Requests queries
  if (
    text.includes('purchase request') ||
    text.includes('my request') ||
    text.includes('buyer request') ||
    text.includes('கோரிக்கை') ||
    text.includes('விருப்பம்')
  ) {
    if (!user) {
      return lang === 'ta'
        ? 'உங்கள் வாங்குதல் கோரிக்கைகளை சரிபார்க்க உள்நுழையவும்.'
        : 'Please log in to check your purchase requests.'
    }
    try {
      const requests = user.role === 'buyer'
        ? await getBuyerPurchaseRequests()
        : await getReceivedPurchaseRequests()

      if (!requests || requests.length === 0) {
        return lang === 'ta'
          ? 'உங்களிடம் எந்த வாங்குதல் கோரிக்கைகளும் இல்லை.'
          : 'You have no purchase requests at this time.'
      }
      const latest = requests[0]
      if (lang === 'ta') {
        return `உங்களிடம் ${requests.length} வாங்குதல் கோரிக்கை(கள்) உள்ளன. சமீபத்திய கோரிக்கை #${latest.id} நிலை: '${latest.status}'.`
      }
      return `You have ${requests.length} purchase request(s). Latest request #${latest.id} status is '${latest.status}'.`
    } catch {
      return lang === 'ta'
        ? 'கோரிக்கை விவரங்களை பெற முடியவில்லை.'
        : 'Unable to fetch purchase request details.'
    }
  }

  // 5. Listing guidance queries
  if (
    text.includes('how do i list') ||
    text.includes('add produce') ||
    text.includes('how to sell') ||
    text.includes('list produce') ||
    text.includes('பதிவு செய்வது') ||
    text.includes('விற்பது எப்படி')
  ) {
    if (lang === 'ta') {
      return "உங்கள் விளைபொருளை பதிவு செய்ய: விவசாயியாக உள்நுழைந்து, Farmer Dashboard சென்று 'Add New Produce' என்பதைக் கிளிக் செய்து விவரங்களை பூர்த்தி செய்யவும்!"
    }
    return "To list your produce: Log in as a Farmer, navigate to the Farmer Dashboard, and click 'Add New Produce'. Enter the crop name, quantity, price, and location!"
  }

  // Fallback for unknown queries
  return lang === 'ta'
    ? "எனக்கு இந்த தகவல் AgriConnect இல் இன்னும் இல்லை."
    : "I don't have that information in AgriConnect yet."
}
