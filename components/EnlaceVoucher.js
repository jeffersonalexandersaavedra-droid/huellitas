import { ExternalLink } from "lucide-react";

// "Ver voucher": abre en otra pestaña la foto que envió el padre.
export default function EnlaceVoucher({ url }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-huellitas-primary hover:underline"
    >
      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
      Ver voucher
    </a>
  );
}
