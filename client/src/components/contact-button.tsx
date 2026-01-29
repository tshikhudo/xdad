import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_PHONE = "27749501677";

export function ContactButton() {
  const handleContact = () => {
    const message = encodeURIComponent("Hi, I'm interested in Febreeze Clean services.");
    window.open(`https://wa.me/${CONTACT_PHONE}?text=${message}`, "_blank");
  };

  return (
    <Button
      onClick={handleContact}
      className="fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 shadow-lg bg-green-600 hover:bg-green-700"
      size="icon"
      data-testid="button-contact-whatsapp"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
    </Button>
  );
}
