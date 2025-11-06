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
  phoneNumber = '6281280272326', // Default phone number
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
    ? 'bottom-4 right-4 sm:bottom-6 sm:right-6' 
    : 'bottom-4 left-4 sm:bottom-6 sm:left-6';

  return (
    <div className={`fixed ${positionClasses} z-50 ${className}`}>
      <Button
        onClick={handleWhatsAppClick}
        size="lg"
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0 animate-bounce-slow hover:animate-none hover:scale-105"
        aria-label="Chat on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
      </Button>
    </div>
  );
};
