import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const CONTACT_PHONE = "27749501677";
const CONTACT_NAME = "Ray";

export function ContactButton() {
  const { t } = useI18n();
  
  const handleContact = () => {
    const message = encodeURIComponent(t("contact.defaultMessage"));
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
