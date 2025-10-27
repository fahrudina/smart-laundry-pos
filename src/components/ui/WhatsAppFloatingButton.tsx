import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  phoneNumber = '6281234567890', // Default phone number
  message = 'Halo, saya tertarik dengan Smart Laundry POS',
  position = 'bottom-right',
  className = ''
}) => {
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6';

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .whatsapp-floating-button {
          animation: bounce 2s ease-in-out infinite;
        }

        .whatsapp-floating-button:hover {
          animation: none;
          transform: scale(1.05);
        }
      `}</style>
      
      <div className={`fixed ${positionClasses} z-50 ${className}`}>
        <Button
          onClick={handleWhatsAppClick}
          size="lg"
          className="whatsapp-floating-button w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0"
          aria-label="Chat on WhatsApp"
          title="Chat with us on WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </div>
    </>
  );
};
