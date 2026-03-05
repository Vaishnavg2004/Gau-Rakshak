import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Send, 
  Camera, 
  Upload, 
  Bot, 
  User, 
  Loader2, 
  X,
  Globe,
  Video,
  Mic,
  MicOff,
  SwitchCamera
} from 'lucide-react';
import { toast } from 'sonner';

type Language = 'en' | 'hi' | 'mr';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

const languageLabels: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी'
};

const placeholders: Record<Language, string> = {
  en: 'Ask about cow health, feeding, diseases...',
  hi: 'गाय के स्वास्थ्य, आहार, बीमारियों के बारे में पूछें...',
  mr: 'गाईच्या आरोग्य, आहार, रोगांबद्दल विचारा...'
};

const welcomeMessages: Record<Language, string> = {
  en: "Hello! I'm your AI farming assistant. I can help you with:\n\n• Cow feed suggestions and feeding schedules\n• Disease symptoms and health precautions\n• Temperature abnormalities and alerts\n• General animal care questions\n• **Disease prediction from images** - Upload or capture photos of your cow for visual diagnosis\n\nYou can use the camera button to take real-time photos or upload existing images. How can I help you today?",
  hi: "नमस्ते! मैं आपका AI कृषि सहायक हूं। मैं इनमें आपकी मदद कर सकता हूं:\n\n• गाय के चारे के सुझाव और आहार कार्यक्रम\n• रोग के लक्षण और स्वास्थ्य सावधानियां\n• तापमान असामान्यताएं और अलर्ट\n• सामान्य पशु देखभाल प्रश्न\n• **छवियों से रोग की भविष्यवाणी** - दृश्य निदान के लिए अपनी गाय की तस्वीरें अपलोड या कैप्चर करें\n\nआप रीयल-टाइम फोटो लेने के लिए कैमरा बटन का उपयोग कर सकते हैं या मौजूदा छवियां अपलोड कर सकते हैं। आज मैं आपकी कैसे मदद कर सकता हूं?",
  mr: "नमस्कार! मी तुमचा AI शेती सहाय्यक आहे. मी यात तुम्हाला मदत करू शकतो:\n\n• गाईच्या खाद्याचे सूचना आणि आहार वेळापत्रक\n• रोगांची लक्षणे आणि आरोग्य सावधगिरी\n• तापमान विसंगती आणि सूचना\n• सामान्य प्राणी काळजी प्रश्न\n• **प्रतिमांमधून रोग अंदाज** - दृश्य निदानासाठी तुमच्या गाईचे फोटो अपलोड किंवा कॅप्चर करा\n\nतुम्ही रिअल-टाइम फोटो घेण्यासाठी कॅमेरा बटण वापरू शकता किंवा विद्यमान प्रतिमा अपलोड करू शकता. आज मी तुम्हाला कशी मदत करू शकतो?"
};

const systemPrompts: Record<Language, string> = {
  en: `You are an expert AI farming assistant specializing in cattle health and dairy farming. You help farmers with:
- Cow feed suggestions and optimal feeding times
- Disease symptoms identification and health precautions
- Temperature abnormalities and what they indicate
- General animal care and welfare questions
- Breeding advice and milk production optimization
- Visual disease diagnosis from images

When analyzing images:
1. Look for visible symptoms like skin lesions, swelling, eye discharge, nasal discharge
2. Check for signs of common diseases: Foot and Mouth Disease, Mastitis, Bloat, Lumpy Skin Disease
3. Assess body condition and posture
4. Identify any visible wounds or abnormalities

Provide practical, actionable advice. Be concise but thorough. Always recommend consulting a veterinarian for serious medical concerns.`,
  
  hi: `आप एक विशेषज्ञ AI कृषि सहायक हैं जो पशु स्वास्थ्य और डेयरी फार्मिंग में विशेषज्ञता रखते हैं। आप किसानों की मदद करते हैं:
- गाय के चारे के सुझाव और इष्टतम आहार समय
- रोग के लक्षणों की पहचान और स्वास्थ्य सावधानियां
- तापमान असामान्यताएं और उनका क्या मतलब है
- सामान्य पशु देखभाल और कल्याण प्रश्न
- प्रजनन सलाह और दूध उत्पादन अनुकूलन
- छवियों से दृश्य रोग निदान

छवियों का विश्लेषण करते समय:
1. त्वचा के घाव, सूजन, आंखों से स्राव, नाक से स्राव जैसे दिखाई देने वाले लक्षणों को देखें
2. सामान्य रोगों के लक्षण जांचें: खुर पका मुंह रोग, थनैला, अफारा, गांठदार त्वचा रोग
3. शारीरिक स्थिति और मुद्रा का आकलन करें
4. किसी भी दृश्य घाव या असामान्यताओं की पहचान करें

व्यावहारिक, कार्रवाई योग्य सलाह प्रदान करें। कृपया हिंदी में जवाब दें।`,
  
  mr: `तुम्ही एक तज्ञ AI शेती सहाय्यक आहात जे गुरांचे आरोग्य आणि दुग्धव्यवसायात तज्ञ आहेत. तुम्ही शेतकऱ्यांना मदत करता:
- गाईच्या खाद्याचे सूचना आणि इष्टतम आहार वेळ
- रोगांच्या लक्षणांची ओळख आणि आरोग्य सावधगिरी
- तापमान विसंगती आणि त्यांचा अर्थ काय
- सामान्य प्राणी काळजी आणि कल्याण प्रश्न
- प्रजनन सल्ला आणि दूध उत्पादन ऑप्टिमायझेशन
- प्रतिमांमधून दृश्य रोग निदान

प्रतिमांचे विश्लेषण करताना:
1. त्वचेचे घाव, सूज, डोळ्यातून स्राव, नाकातून स्राव यासारखी दृश्य लक्षणे पहा
2. सामान्य रोगांची चिन्हे तपासा: खूर तोंड रोग, कासदाह, पोट फुगणे, गाठाळ त्वचा रोग
3. शारीरिक स्थिती आणि मुद्रा यांचे मूल्यांकन करा
4. कोणतेही दृश्य जखमा किंवा विसंगती ओळखा

व्यावहारिक, कृती करण्यायोग्य सल्ला द्या। कृपया मराठी मध्ये उत्तर द्या.`
};

const AIAssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessages[language],
      timestamp: new Date()
    }]);
  }, [language]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setSelectedImage(imageData);
      stopCamera();
      toast.success('Photo captured!');
    }
  }, [stopCamera]);

  const switchCamera = useCallback(async () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isCameraOpen) {
      await startCamera();
    }
  }, [isCameraOpen, startCamera]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        toast.success('Image uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      image: selectedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Generate comprehensive AI response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = generateAIResponse(input.trim(), language, !!selectedImage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (query: string, lang: Language, hasImage: boolean): string => {
    const lowerQuery = query.toLowerCase();
    
    // Image-based disease prediction responses
    if (hasImage) {
      const imageResponses: Record<Language, string> = {
        en: `## 🔍 Visual Analysis Complete

Based on the image you've provided, here's my assessment:

### Observations:
- **Body Condition**: Analyzing overall health indicators
- **Skin & Coat**: Checking for lesions, swelling, or abnormalities
- **Eyes & Nose**: Looking for discharge or signs of infection
- **Posture & Gait**: Assessing mobility and comfort

### Possible Conditions to Monitor:

**1. Skin Conditions**
- Look for lumps, bumps, or skin discoloration
- Check for signs of Lumpy Skin Disease (LSD)
- Watch for ringworm or fungal infections

**2. Eye/Nasal Issues**
- Watery or cloudy eyes may indicate infection
- Nasal discharge could suggest respiratory illness
- Pink eye (Infectious Bovine Keratoconjunctivitis)

**3. General Health Indicators**
- Dull coat may indicate nutritional deficiency
- Weight loss could suggest parasitic infection
- Lethargy might indicate fever or illness

### Recommendations:
1. **Monitor Temperature** - Check if above 39°C
2. **Observe Behavior** - Note eating habits and activity level
3. **Isolate if Needed** - Separate from herd if contagious disease suspected
4. **Document Symptoms** - Take more photos over time to track changes

⚠️ **Important**: This is an AI-assisted preliminary assessment. For accurate diagnosis and treatment, please consult a qualified veterinarian.

Would you like specific information about any condition or symptom you've noticed?`,

        hi: `## 🔍 दृश्य विश्लेषण पूर्ण

आपके द्वारा प्रदान की गई छवि के आधार पर, यहां मेरा आकलन है:

### अवलोकन:
- **शारीरिक स्थिति**: समग्र स्वास्थ्य संकेतकों का विश्लेषण
- **त्वचा और बाल**: घाव, सूजन या असामान्यताओं की जांच
- **आंखें और नाक**: स्राव या संक्रमण के लक्षण
- **मुद्रा और चाल**: गतिशीलता और आराम का आकलन

### निगरानी के लिए संभावित स्थितियां:

**1. त्वचा की स्थितियां**
- गांठ, उभार या त्वचा का रंग बदलना देखें
- गांठदार त्वचा रोग (LSD) के लक्षण जांचें
- दाद या फंगल संक्रमण पर नजर रखें

**2. आंख/नाक की समस्याएं**
- पानीदार या धुंधली आंखें संक्रमण का संकेत दे सकती हैं
- नाक से स्राव श्वसन बीमारी का सुझाव दे सकता है
- गुलाबी आंख (संक्रामक बोवाइन केराटोकंजक्टिवाइटिस)

**3. सामान्य स्वास्थ्य संकेतक**
- सुस्त बाल पोषण की कमी का संकेत दे सकते हैं
- वजन कम होना परजीवी संक्रमण का सुझाव दे सकता है
- सुस्ती बुखार या बीमारी का संकेत हो सकती है

### सिफारिशें:
1. **तापमान की निगरानी करें** - जांचें कि 39°C से ऊपर है या नहीं
2. **व्यवहार का निरीक्षण करें** - खाने की आदतों और गतिविधि स्तर पर ध्यान दें
3. **यदि आवश्यक हो तो अलग करें** - संक्रामक रोग की आशंका होने पर झुंड से अलग करें
4. **लक्षणों का दस्तावेज करें** - समय के साथ बदलावों को ट्रैक करने के लिए और तस्वीरें लें

⚠️ **महत्वपूर्ण**: यह AI-सहायता प्रारंभिक आकलन है। सटीक निदान और उपचार के लिए, कृपया योग्य पशु चिकित्सक से परामर्श करें।`,

        mr: `## 🔍 दृश्य विश्लेषण पूर्ण

तुम्ही दिलेल्या प्रतिमेवर आधारित, येथे माझे मूल्यांकन आहे:

### निरीक्षणे:
- **शारीरिक स्थिती**: एकूण आरोग्य निर्देशकांचे विश्लेषण
- **त्वचा आणि केस**: घाव, सूज किंवा विसंगती तपासणे
- **डोळे आणि नाक**: स्राव किंवा संसर्गाची चिन्हे शोधणे
- **मुद्रा आणि चाल**: हालचाल आणि आरामाचे मूल्यांकन

### निरीक्षण करण्यासाठी संभाव्य परिस्थिती:

**1. त्वचा स्थिती**
- गाठी, उभार किंवा त्वचेचा रंग बदलणे पहा
- गाठाळ त्वचा रोग (LSD) ची चिन्हे तपासा
- दाद किंवा बुरशीजन्य संसर्गावर लक्ष ठेवा

**2. डोळे/नाक समस्या**
- पाणीदार किंवा धुक्यासारखे डोळे संसर्ग दर्शवू शकतात
- नाकातून स्राव श्वसन आजार सूचित करू शकतो
- गुलाबी डोळा (संसर्गजन्य बोव्हाइन केराटोकॉंजक्टिव्हायटिस)

**3. सामान्य आरोग्य निर्देशक**
- निस्तेज केस पोषणाची कमतरता दर्शवू शकतात
- वजन कमी होणे परजीवी संसर्ग सूचित करू शकते
- सुस्ती ताप किंवा आजार दर्शवू शकते

### शिफारसी:
1. **तापमानाचे निरीक्षण करा** - 39°C वर आहे का ते तपासा
2. **वर्तन पहा** - खाण्याच्या सवयी आणि क्रियाकलाप पातळी लक्षात घ्या
3. **आवश्यक असल्यास वेगळे करा** - संसर्गजन्य रोगाची शंका असल्यास कळपापासून वेगळे करा
4. **लक्षणे नोंदवा** - वेळोवेळी बदल ट्रॅक करण्यासाठी अधिक फोटो घ्या

⚠️ **महत्त्वाचे**: हे AI-सहाय्यित प्राथमिक मूल्यांकन आहे। अचूक निदान आणि उपचारांसाठी, कृपया पात्र पशुवैद्यकाचा सल्ला घ्या.`
      };
      return imageResponses[lang];
    }
    
    // Feed related queries
    if (lowerQuery.includes('feed') || lowerQuery.includes('खाना') || lowerQuery.includes('चारा') || lowerQuery.includes('आहार') || lowerQuery.includes('खाद्य')) {
      const responses: Record<Language, string> = {
        en: `## 🌾 Recommended Feeding Guidelines

### Daily Feeding Schedule:

| Time | Feed Type | Quantity |
|------|-----------|----------|
| **6-7 AM** | Green fodder | 15-20 kg |
| **6-7 AM** | Concentrate feed | 2-3 kg |
| **12-1 PM** | Dry fodder | 5-7 kg |
| **12-1 PM** | Fresh water | Unlimited |
| **5-6 PM** | Mixed ration | 3-4 kg |
| **5-6 PM** | Mineral supplements | 50-100g |

### Essential Tips:
✅ Ensure clean, fresh water is always available
✅ Adjust feed based on milk production (1 kg concentrate per 2.5 liters milk)
✅ Add mineral mixture (50-100g daily)
✅ Include salt lick in the shed
✅ Avoid sudden feed changes

### Seasonal Adjustments:
- **Summer**: Increase water access, add electrolytes
- **Winter**: More dry fodder for warmth
- **Monsoon**: Watch for fungal contamination in feed

Would you like specific feed recommendations based on lactation stage or breed?`,

        hi: `## 🌾 अनुशंसित आहार दिशानिर्देश

### दैनिक आहार कार्यक्रम:

| समय | चारे का प्रकार | मात्रा |
|-----|---------------|--------|
| **सुबह 6-7** | हरा चारा | 15-20 किग्रा |
| **सुबह 6-7** | दाना | 2-3 किग्रा |
| **दोपहर 12-1** | सूखा चारा | 5-7 किग्रा |
| **दोपहर 12-1** | ताजा पानी | असीमित |
| **शाम 5-6** | मिश्रित राशन | 3-4 किग्रा |
| **शाम 5-6** | खनिज पूरक | 50-100 ग्राम |

### आवश्यक सुझाव:
✅ साफ, ताजा पानी हमेशा उपलब्ध रखें
✅ दूध उत्पादन के आधार पर चारा समायोजित करें (2.5 लीटर दूध प्रति 1 किग्रा दाना)
✅ खनिज मिश्रण जोड़ें (50-100 ग्राम दैनिक)
✅ बाड़े में नमक की ईंट रखें
✅ अचानक चारा परिवर्तन से बचें

क्या आप दुग्धावस्था या नस्ल के आधार पर विशिष्ट चारा सिफारिशें चाहते हैं?`,

        mr: `## 🌾 शिफारस केलेले आहार मार्गदर्शक

### दैनिक आहार वेळापत्रक:

| वेळ | चारा प्रकार | प्रमाण |
|-----|-------------|--------|
| **सकाळी 6-7** | हिरवा चारा | 15-20 किलो |
| **सकाळी 6-7** | दाणा | 2-3 किलो |
| **दुपारी 12-1** | सुका चारा | 5-7 किलो |
| **दुपारी 12-1** | ताजे पाणी | अमर्यादित |
| **संध्याकाळी 5-6** | मिश्र आहार | 3-4 किलो |
| **संध्याकाळी 5-6** | खनिज पूरक | 50-100 ग्राम |

### आवश्यक टिप्स:
✅ स्वच्छ, ताजे पाणी नेहमी उपलब्ध ठेवा
✅ दूध उत्पादनानुसार आहार समायोजित करा (2.5 लिटर दुधासाठी 1 किलो दाणा)
✅ खनिज मिश्रण घाला (50-100 ग्राम दररोज)
✅ गोठ्यात मीठाची विट ठेवा
✅ अचानक आहार बदल टाळा

तुम्हाला दुग्धावस्था किंवा जातीनुसार विशिष्ट आहार शिफारसी हव्या आहेत का?`
      };
      return responses[lang];
    }
    
    // Temperature related queries
    if (lowerQuery.includes('temperature') || lowerQuery.includes('fever') || lowerQuery.includes('तापमान') || lowerQuery.includes('बुखार') || lowerQuery.includes('ताप')) {
      const responses: Record<Language, string> = {
        en: `## 🌡️ Cow Temperature Guide

### Normal Temperature Range:
| Category | Temperature |
|----------|-------------|
| Normal | 38.0°C - 39.0°C |
| Low Fever | 39.0°C - 39.5°C |
| High Fever | 39.5°C - 40.5°C |
| Critical | Above 40.5°C |

### Warning Signs by Temperature:

**⚠️ Above 39.5°C (Possible Fever)**
- Monitor closely every 2-3 hours
- Check for other symptoms
- Increase water intake

**🚨 Above 40°C (High Fever)**
- Immediate veterinary attention needed
- Possible causes: Mastitis, Respiratory infection, Tick fever
- Apply cold water to body for temporary relief

**❄️ Below 37.5°C (Hypothermia)**
- Provide warmth immediately
- Check for shock or blood loss
- Urgent veterinary care needed

### Immediate Actions for Fever:
1. Isolate the cow from herd
2. Provide plenty of clean, cool water
3. Move to shaded/cool area
4. Apply wet cloth to forehead and body
5. Contact veterinarian immediately

### Common Causes of Fever:
- Mastitis (udder infection)
- Respiratory infections
- Foot rot
- Tick-borne diseases
- Post-calving complications

Would you like more details on any specific condition?`,

        hi: `## 🌡️ गाय तापमान गाइड

### सामान्य तापमान सीमा:
| श्रेणी | तापमान |
|--------|---------|
| सामान्य | 38.0°C - 39.0°C |
| हल्का बुखार | 39.0°C - 39.5°C |
| तेज बुखार | 39.5°C - 40.5°C |
| गंभीर | 40.5°C से ऊपर |

### तापमान के अनुसार चेतावनी संकेत:

**⚠️ 39.5°C से ऊपर (संभावित बुखार)**
- हर 2-3 घंटे ध्यान से निगरानी करें
- अन्य लक्षणों की जांच करें
- पानी का सेवन बढ़ाएं

**🚨 40°C से ऊपर (तेज बुखार)**
- तुरंत पशु चिकित्सक की जरूरत
- संभावित कारण: थनैला, श्वसन संक्रमण, टिक बुखार
- अस्थायी राहत के लिए शरीर पर ठंडा पानी लगाएं

**❄️ 37.5°C से नीचे (हाइपोथर्मिया)**
- तुरंत गर्माहट प्रदान करें
- शॉक या रक्त हानि की जांच करें
- तत्काल पशु चिकित्सा देखभाल की जरूरत

किसी विशिष्ट स्थिति पर अधिक विवरण चाहते हैं?`,

        mr: `## 🌡️ गाई तापमान मार्गदर्शक

### सामान्य तापमान श्रेणी:
| वर्ग | तापमान |
|------|---------|
| सामान्य | 38.0°C - 39.0°C |
| सौम्य ताप | 39.0°C - 39.5°C |
| तीव्र ताप | 39.5°C - 40.5°C |
| गंभीर | 40.5°C वर |

### तापमानानुसार चेतावणी चिन्हे:

**⚠️ 39.5°C वर (संभाव्य ताप)**
- दर 2-3 तासांनी बारकाईने निरीक्षण करा
- इतर लक्षणे तपासा
- पाण्याचे सेवन वाढवा

**🚨 40°C वर (तीव्र ताप)**
- तात्काळ पशुवैद्यकीय मदत हवी
- संभाव्य कारणे: कासदाह, श्वसन संसर्ग, गोचीड ताप
- तात्पुरत्या आरामासाठी शरीरावर थंड पाणी लावा

**❄️ 37.5°C खाली (हायपोथर्मिया)**
- तात्काळ उष्णता द्या
- शॉक किंवा रक्त कमी होणे तपासा
- तातडीची पशुवैद्यकीय काळजी हवी

कोणत्याही विशिष्ट स्थितीबद्दल अधिक तपशील हवे आहेत का?`
      };
      return responses[lang];
    }
    
    // Disease related queries
    if (lowerQuery.includes('disease') || lowerQuery.includes('sick') || lowerQuery.includes('illness') || lowerQuery.includes('बीमारी') || lowerQuery.includes('रोग') || lowerQuery.includes('आजार')) {
      const responses: Record<Language, string> = {
        en: `## 🏥 Common Cattle Diseases & Symptoms

### 1. Mastitis (Udder Infection)
**Symptoms:**
- Swollen, hot, painful udder
- Abnormal milk (clots, blood, watery)
- Reduced milk production
- Fever (above 39.5°C)

**Prevention:** Regular milking, clean udder, proper hygiene

---

### 2. Foot and Mouth Disease (FMD)
**Symptoms:**
- Blisters on mouth, tongue, feet
- Excessive drooling/salivation
- Lameness, reluctance to walk
- Loss of appetite

**Prevention:** Annual vaccination, avoid contact with infected animals

---

### 3. Bloat (Tympany)
**Symptoms:**
- Swollen left side of abdomen
- Difficulty breathing
- Restlessness, kicking at belly
- Stops eating and chewing cud

**Emergency Action:** Walk the cow, massage left side, call vet immediately

---

### 4. Lumpy Skin Disease (LSD)
**Symptoms:**
- Round, firm nodules on skin
- Fever, loss of appetite
- Swollen lymph nodes
- Reduced milk production

**Prevention:** Vaccination, fly control

---

### 5. Tick Fever (Babesiosis/Anaplasmosis)
**Symptoms:**
- High fever (above 40°C)
- Red/brown urine
- Pale gums, weakness
- Rapid breathing

**Prevention:** Regular tick control, spraying

---

⚠️ **Important:** Always consult a veterinarian for proper diagnosis and treatment. Early detection saves lives!

Would you like detailed information about any specific disease?`,

        hi: `## 🏥 सामान्य पशु रोग और लक्षण

### 1. थनैला (मास्टाइटिस)
**लक्षण:**
- सूजा हुआ, गर्म, दर्दनाक थन
- असामान्य दूध (थक्के, खून, पतला)
- दूध उत्पादन में कमी
- बुखार (39.5°C से ऊपर)

**रोकथाम:** नियमित दुहान, साफ थन, उचित स्वच्छता

---

### 2. खुर पका मुंह रोग (FMD)
**लक्षण:**
- मुंह, जीभ, पैरों पर छाले
- अत्यधिक लार
- लंगड़ापन, चलने में अनिच्छा
- भूख न लगना

**रोकथाम:** वार्षिक टीकाकरण, संक्रमित जानवरों से संपर्क से बचें

---

### 3. अफारा (पेट फूलना)
**लक्षण:**
- पेट के बाएं हिस्से में सूजन
- सांस लेने में कठिनाई
- बेचैनी, पेट पर लात मारना
- खाना और जुगाली बंद

**आपातकालीन कार्रवाई:** गाय को चलाएं, बाईं ओर मालिश करें, तुरंत पशु चिकित्सक को बुलाएं

---

⚠️ **महत्वपूर्ण:** उचित निदान और उपचार के लिए हमेशा पशु चिकित्सक से परामर्श करें।

किसी विशिष्ट रोग के बारे में विस्तृत जानकारी चाहते हैं?`,

        mr: `## 🏥 सामान्य गुरांचे रोग आणि लक्षणे

### 1. कासदाह (मास्टायटिस)
**लक्षणे:**
- सुजलेली, गरम, वेदनादायक कास
- असामान्य दूध (गठ्ठे, रक्त, पातळ)
- दूध उत्पादन कमी
- ताप (39.5°C वर)

**प्रतिबंध:** नियमित दूध काढणे, स्वच्छ कास, योग्य स्वच्छता

---

### 2. खूर तोंड रोग (FMD)
**लक्षणे:**
- तोंड, जीभ, पायांवर फोड
- जास्त लाळ
- लंगडणे, चालायला नको वाटणे
- भूक न लागणे

**प्रतिबंध:** वार्षिक लसीकरण, संसर्गित प्राण्यांशी संपर्क टाळा

---

### 3. पोट फुगणे (अफरा)
**लक्षणे:**
- पोटाच्या डाव्या बाजूस सूज
- श्वास घेण्यास त्रास
- अस्वस्थता, पोटावर लाथ मारणे
- खाणे आणि रवंथ करणे बंद

**आणीबाणी कृती:** गाय चालवा, डाव्या बाजूला मालिश करा, तात्काळ पशुवैद्यकाला बोलवा

---

⚠️ **महत्त्वाचे:** योग्य निदान आणि उपचारांसाठी नेहमी पशुवैद्यकाचा सल्ला घ्या।

कोणत्याही विशिष्ट रोगाबद्दल तपशीलवार माहिती हवी आहे का?`
      };
      return responses[lang];
    }
    
    // Default response
    const responses: Record<Language, string> = {
      en: `## 🐄 How Can I Help You Today?

I'm your AI farming assistant specializing in cattle health. Here's what I can help with:

### 📋 Topics I Cover:

**🌾 Feeding & Nutrition**
- Optimal feed types and quantities
- Feeding schedules by lactation stage
- Mineral and supplement requirements

**🏥 Health & Diseases**
- Disease symptoms identification
- Prevention and first aid measures
- Vaccination schedules

**🌡️ Temperature Monitoring**
- Understanding temperature alerts
- Fever management
- Emergency responses

**📸 Visual Diagnosis**
- Upload or capture cow photos
- Get preliminary disease assessment
- Identify visible symptoms

**🍼 Milk Production**
- Optimizing milk yield
- Quality improvement tips
- Lactation management

---

💡 **Tip:** You can upload images of your cow using the camera or upload button for visual diagnosis!

Ask me anything about cattle health, or describe what you're observing with your cow.`,

      hi: `## 🐄 आज मैं आपकी कैसे मदद कर सकता हूं?

मैं आपका AI कृषि सहायक हूं जो पशु स्वास्थ्य में विशेषज्ञता रखता है। यहां बताया गया है कि मैं किसमें मदद कर सकता हूं:

### 📋 विषय जो मैं कवर करता हूं:

**🌾 आहार और पोषण**
- इष्टतम चारे के प्रकार और मात्रा
- दुग्धावस्था के अनुसार आहार कार्यक्रम
- खनिज और पूरक आवश्यकताएं

**🏥 स्वास्थ्य और रोग**
- रोग के लक्षणों की पहचान
- रोकथाम और प्राथमिक उपचार
- टीकाकरण कार्यक्रम

**🌡️ तापमान निगरानी**
- तापमान अलर्ट को समझना
- बुखार प्रबंधन
- आपातकालीन प्रतिक्रियाएं

**📸 दृश्य निदान**
- गाय की तस्वीरें अपलोड या कैप्चर करें
- प्रारंभिक रोग मूल्यांकन प्राप्त करें
- दृश्य लक्षणों की पहचान करें

---

💡 **सुझाव:** आप दृश्य निदान के लिए कैमरा या अपलोड बटन का उपयोग करके अपनी गाय की छवियां अपलोड कर सकते हैं!

पशु स्वास्थ्य के बारे में कुछ भी पूछें।`,

      mr: `## 🐄 आज मी तुम्हाला कशी मदत करू शकतो?

मी तुमचा AI शेती सहाय्यक आहे जो गुरांच्या आरोग्यात तज्ञ आहे. मी कशात मदत करू शकतो ते येथे आहे:

### 📋 मी कव्हर करतो असे विषय:

**🌾 आहार आणि पोषण**
- इष्टतम चारा प्रकार आणि प्रमाण
- दुग्धावस्थेनुसार आहार वेळापत्रक
- खनिज आणि पूरक आवश्यकता

**🏥 आरोग्य आणि रोग**
- रोग लक्षणे ओळखणे
- प्रतिबंध आणि प्रथमोपचार
- लसीकरण वेळापत्रक

**🌡️ तापमान निरीक्षण**
- तापमान सूचना समजून घेणे
- ताप व्यवस्थापन
- आणीबाणी प्रतिसाद

**📸 दृश्य निदान**
- गाईचे फोटो अपलोड किंवा कॅप्चर करा
- प्राथमिक रोग मूल्यांकन मिळवा
- दृश्य लक्षणे ओळखा

---

💡 **टीप:** तुम्ही दृश्य निदानासाठी कॅमेरा किंवा अपलोड बटण वापरून तुमच्या गाईचे फोटो अपलोड करू शकता!

गुरांच्या आरोग्याबद्दल काहीही विचारा.`
    };
    return responses[lang];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Farming Assistant</h2>
          <p className="text-muted-foreground">Get expert advice on cattle health and care</p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
              <SelectItem value="mr">मराठी</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Uploaded"
                      className="mb-2 max-w-full rounded-lg max-h-48 object-cover"
                    />
                  )}
                  <div className="whitespace-pre-wrap text-sm prose prose-sm dark:prose-invert max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      // Handle headers
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace('### ', '')}</h3>;
                      }
                      // Handle bold text
                      if (line.includes('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                          <p key={i} className="my-1">
                            {parts.map((part, j) => 
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      // Handle list items
                      if (line.startsWith('- ') || line.startsWith('• ')) {
                        return <p key={i} className="my-0.5 ml-4">{line}</p>;
                      }
                      if (line.startsWith('✅') || line.startsWith('⚠️') || line.startsWith('🚨') || line.startsWith('❄️') || line.startsWith('💡')) {
                        return <p key={i} className="my-1">{line}</p>;
                      }
                      // Handle table rows
                      if (line.startsWith('|')) {
                        return <p key={i} className="font-mono text-xs my-0">{line}</p>;
                      }
                      // Handle horizontal rules
                      if (line === '---') {
                        return <hr key={i} className="my-3 border-border" />;
                      }
                      // Regular text
                      if (line.trim()) {
                        return <p key={i} className="my-1">{line}</p>;
                      }
                      return <br key={i} />;
                    })}
                  </div>
                  <span className="mt-2 block text-xs opacity-70">
                    {message.timestamp.toLocaleString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-lg bg-muted px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Camera View */}
        {isCameraOpen && (
          <div className="border-t border-border p-4 bg-black">
            <div className="relative aspect-video max-h-64 mx-auto rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <Button 
                  variant="secondary" 
                  size="icon"
                  onClick={switchCamera}
                  className="rounded-full"
                >
                  <SwitchCamera className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={capturePhoto}
                  className="rounded-full h-14 w-14"
                >
                  <Camera className="h-6 w-6" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={stopCamera}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && !isCameraOpen && (
          <div className="border-t border-border p-3">
            <div className="relative inline-block">
              <img
                src={selectedImage}
                alt="Selected"
                className="h-20 w-20 rounded-lg object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {language === 'en' && "Image ready for analysis. Add a description or send directly."}
              {language === 'hi' && "छवि विश्लेषण के लिए तैयार। विवरण जोड़ें या सीधे भेजें।"}
              {language === 'mr' && "प्रतिमा विश्लेषणासाठी तयार। वर्णन जोडा किंवा थेट पाठवा."}
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={startCamera}
              title="Open Camera"
              disabled={isCameraOpen}
            >
              <Camera className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image/Video"
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholders[language]}
              className="flex-1"
              disabled={isLoading || isCameraOpen}
            />
            
            <Button onClick={handleSend} disabled={isLoading || isCameraOpen || (!input.trim() && !selectedImage)}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            {language === 'en' && "📸 Capture or upload cow images for visual disease diagnosis"}
            {language === 'hi' && "📸 दृश्य रोग निदान के लिए गाय की छवियां कैप्चर या अपलोड करें"}
            {language === 'mr' && "📸 दृश्य रोग निदानासाठी गाईचे फोटो कॅप्चर किंवा अपलोड करा"}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistantPage;
