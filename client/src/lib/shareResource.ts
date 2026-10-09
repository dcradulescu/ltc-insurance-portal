import { toast } from "sonner";

export async function shareResource(data: ShareData, copiedMessage = "Link copied!", description?: string) {
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
    } else {
      if (!navigator.clipboard || !data.url) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(data.url);
      toast.success(copiedMessage, { description });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Unable to share automatically. Copy the page address from your browser to share it.");
  }
}
