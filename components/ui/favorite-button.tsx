'use client';

import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type FavoriteButtonProps = {
  questionId: string;
  isFavorited?: boolean;
};

export function FavoriteButton({ questionId, isFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: favorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      setFavorited(!favorited);
      toast.success(favorited ? '已取消收藏' : '已收藏');
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleFavorite}
      disabled={loading}
    >
      <Heart className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
    </Button>
  );
}