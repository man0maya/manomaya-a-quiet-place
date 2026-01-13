import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  itemId: string;
  itemType: "quote" | "story";
  className?: string;
}

// Generate a session ID for anonymous users
const getSessionId = () => {
  let sessionId = localStorage.getItem("manomaya_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("manomaya_session_id", sessionId);
  }
  return sessionId;
};

const LikeButton = ({ itemId, itemType, className }: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      const sessionId = getSessionId();
      
      if (itemType === "quote") {
        // Get total likes count
        const { count } = await supabase
          .from("quote_likes")
          .select("*", { count: "exact", head: true })
          .eq("quote_id", itemId);
        
        setLikeCount(count || 0);

        // Check if current session liked this item
        const { data } = await supabase
          .from("quote_likes")
          .select("id")
          .eq("quote_id", itemId)
          .eq("session_id", sessionId)
          .maybeSingle();

        setIsLiked(!!data);
      } else {
        // Get total likes count
        const { count } = await supabase
          .from("story_likes")
          .select("*", { count: "exact", head: true })
          .eq("story_id", itemId);
        
        setLikeCount(count || 0);

        // Check if current session liked this item
        const { data } = await supabase
          .from("story_likes")
          .select("id")
          .eq("story_id", itemId)
          .eq("session_id", sessionId)
          .maybeSingle();

        setIsLiked(!!data);
      }
    };

    if (itemId) {
      fetchLikeStatus();
    }
  }, [itemId, itemType]);

  const handleToggleLike = async () => {
    if (isLoading || !itemId) return;
    
    setIsLoading(true);
    const sessionId = getSessionId();

    try {
      if (itemType === "quote") {
        if (isLiked) {
          await supabase
            .from("quote_likes")
            .delete()
            .eq("quote_id", itemId)
            .eq("session_id", sessionId);
          
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        } else {
          await supabase
            .from("quote_likes")
            .insert({ quote_id: itemId, session_id: sessionId });
          
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        }
      } else {
        if (isLiked) {
          await supabase
            .from("story_likes")
            .delete()
            .eq("story_id", itemId)
            .eq("session_id", sessionId);
          
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        } else {
          await supabase
            .from("story_likes")
            .insert({ story_id: itemId, session_id: sessionId });
          
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-all duration-300",
        isLiked 
          ? "text-red-500" 
          : "text-muted-foreground hover:text-red-400",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <Heart 
        size={18} 
        className={cn(
          "transition-all duration-300",
          isLiked && "fill-current scale-110"
        )} 
      />
      {likeCount > 0 && <span>{likeCount}</span>}
    </button>
  );
};

export default LikeButton;
