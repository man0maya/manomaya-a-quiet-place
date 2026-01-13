import { Share2, Twitter, Facebook, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

const ShareButton = ({ title, text, url, className }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const shareText = `${text} - ${title}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    }
  };

  // Use native share on mobile if available
  if (navigator.share) {
    return (
      <button
        onClick={handleNativeShare}
        className={cn(
          "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors",
          className
        )}
        aria-label="Share"
      >
        <Share2 size={18} />
        <span className="hidden sm:inline">Share</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors",
            className
          )}
          aria-label="Share"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer">
          <Twitter size={16} className="mr-2" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareFacebook} className="cursor-pointer">
          <Facebook size={16} className="mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check size={16} className="mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon size={16} className="mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
