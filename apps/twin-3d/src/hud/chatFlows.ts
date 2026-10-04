export interface ChatMessage {
  id: string
  sender: 'farmer' | 'bot' | 'driver'
  senderName: string
  type: 'voice' | 'text' | 'json' | 'confirmation'
  content: string
  translation?: string
  audioDuration?: string
  parsedData?: {
    crop: string
    quantity: string
    village: string
    destination: string
    pickupTime: string
    quotedFare?: string
  }
  delayMs?: number
  actionPayload?: {
    kind: 'village' | 'truck'
    key: string
  }
}

export interface ChatFlow {
  id: string
  title: string
  subtitle: string
  outcome: 'matched' | 'refused' | 'pooled'
  messages: ChatMessage[]
}

export const CHAT_FLOWS: ChatFlow[] = [
  {
    id: 'flow-sakore',
    title: 'Flow 1: Standard 200kg Match',
    subtitle: 'Sakore → Nashik APMC · Voice Booking',
    outcome: 'matched',
    messages: [
      {
        id: 'm1',
        sender: 'farmer',
        senderName: 'Ramesh Jadhav (Sakore)',
        type: 'voice',
        content: '🎙️ "200 kilo tamatar ahe, Sakore gaon, kal sakali Nashik market pathvayche ahe."',
        translation: 'English: "Have 200 kg tomatoes, Sakore village, want to send to Nashik APMC tomorrow morning."',
        audioDuration: '0:07',
        actionPayload: { kind: 'village', key: 'sakore' },
      },
      {
        id: 'm2',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'json',
        content: 'Recognised pickup request and mapped to Nashik South corridor.',
        parsedData: {
          crop: 'Tomato',
          quantity: '200 kg (8 crates)',
          village: 'Sakore (Branch 1)',
          destination: 'Nashik APMC',
          pickupTime: 'Tomorrow 05:45 AM',
          quotedFare: '₹168 guaranteed pooled fare',
        },
      },
      {
        id: 'm3',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'text',
        content:
          '✅ Ramesh ji, aapka booking confirm ho gaya hai! Truck MH-15-EG-4412 (Driver: Eknath) kal 05:45 AM Sakore aayega. Aapka kiraya: ₹168 (Akela truck ₹2,100 ka hota).',
      },
      {
        id: 'm4',
        sender: 'driver',
        senderName: 'Driver Eknath (Bolero SCV)',
        type: 'text',
        content:
          '👍 "1 - Sweekar kela (Accepted). Sakore junction chya mandir jawal pickup karen."',
        actionPayload: { kind: 'truck', key: 'truck_1' },
      },
      {
        id: 'm5',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'confirmation',
        content:
          '🎉 Match Completed! Truck space allocated: 200/1500 kg. Driver will call 15 mins before arrival.',
      },
    ],
  },
  {
    id: 'flow-bhuse',
    title: 'Flow 2: 40kg Solo Detour Refusal',
    subtitle: 'Bhuse · Economics Check & Consolidation',
    outcome: 'refused',
    messages: [
      {
        id: 'm1',
        sender: 'farmer',
        senderName: 'Sunita Gaikwad (Bhuse)',
        type: 'voice',
        content: '🎙️ "Fakta 40 kilo tamatar ahet, Bhuse gaonitun jaun ghyal ka?"',
        translation: 'English: "Only 40 kg tomatoes, can someone pick up from Bhuse village?"',
        audioDuration: '0:05',
        actionPayload: { kind: 'village', key: 'bhuse' },
      },
      {
        id: 'm2',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'json',
        content: 'Detour economics calculation for solo branch entry.',
        parsedData: {
          crop: 'Tomato',
          quantity: '40 kg',
          village: 'Bhuse (Isolated node)',
          destination: 'Nashik APMC',
          pickupTime: 'Tomorrow morning',
          quotedFare: 'Detour fuel ₹137 > Fare ₹33 (Unviable solo)',
        },
      },
      {
        id: 'm3',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'text',
        content:
          '⚠️ Sunita ji, 40 kg ke liye Bhuse ka 14 km detour diesel cost ₹137 aata hai, jabki 40 kg ka fare sirf ₹33 banta hai. Driver ko ₹104 ka nuksan hoga.',
      },
      {
        id: 'm4',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'confirmation',
        content:
          '💡 Solution: Drop 40 kg at Pimpalgaon main road collection point (3 km) to travel for ₹33, OR wait for another neighbor in Bhuse to pool together!',
      },
    ],
  },
  {
    id: 'flow-pooled',
    title: 'Flow 3: Branch Co-Pooling',
    subtitle: 'Mohadi + Korhate · Shared Branch Success',
    outcome: 'pooled',
    messages: [
      {
        id: 'm1',
        sender: 'farmer',
        senderName: 'Balu Shinde (Korhate)',
        type: 'voice',
        content: '🎙️ "300 kilo pyaz ahe Korhate madhun."',
        translation: 'English: "300 kg onions from Korhate."',
        audioDuration: '0:04',
        actionPayload: { kind: 'village', key: 'korhate' },
      },
      {
        id: 'm2',
        sender: 'farmer',
        senderName: 'Sunita (Mohadi - same branch)',
        type: 'voice',
        content: '🎙️ "Mohadi madhun 50 kilo tamatar ahet."',
        translation: 'English: "50 kg tomatoes from Mohadi."',
        audioDuration: '0:04',
        actionPayload: { kind: 'village', key: 'mohadi' },
      },
      {
        id: 'm3',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'json',
        content: 'Combined Branch 2 entry optimization: branch diesel split 2 ways.',
        parsedData: {
          crop: 'Onions + Tomatoes',
          quantity: '350 kg combined',
          village: 'Korhate & Mohadi (Branch 2)',
          destination: 'Nashik APMC',
          pickupTime: 'Tomorrow 06:15 AM',
          quotedFare: 'Split branch cost: Balu ₹234, Sunita ₹58',
        },
      },
      {
        id: 'm4',
        sender: 'bot',
        senderName: 'Harvest Assistant',
        type: 'confirmation',
        content:
          '🤝 Branch Synergy: Because Balu & Sunita share the same branch road, both pickups are confirmed profitably on Truck MH-15-BR-9011!',
        actionPayload: { kind: 'truck', key: 'truck_2' },
      },
    ],
  },
]
