import React, { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { marketplaceApi } from '../services';
import { toast } from 'sonner';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface ReviewModalProps {
  orderId: number;
  vendorId: number;
  vendorName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  orderId,
  vendorId,
  vendorName,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEscapeKey(() => { if (!isSubmitting) onClose(); });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }

    setIsSubmitting(true);
    try {
      await marketplaceApi.createVendorReview(vendorId, {
        vendor_id: vendorId,
        order_id: orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success('Review submitted successfully!');
      onSubmitted();
      onClose();
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Failed to submit review';
      toast.error(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h3>Leave a Review</h3>
          <button className="review-modal-close" onClick={onClose} aria-label="Close review modal">
            <X size={20} />
          </button>
        </div>

        {vendorName && (
          <p className="review-modal-vendor">Rating for <strong>{vendorName}</strong></p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="review-stars">
            <label>Your Rating</label>
            <div className="star-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= displayRating ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star size={28} fill={star <= displayRating ? 'currentColor' : 'none'} />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="star-label">
                  {displayRating === 1 && 'Poor'}
                  {displayRating === 2 && 'Fair'}
                  {displayRating === 3 && 'Good'}
                  {displayRating === 4 && 'Great'}
                  {displayRating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <div className="review-comment">
            <label>Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this vendor..."
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="review-modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
