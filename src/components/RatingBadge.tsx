import type { SafetyRating } from '@/types';

const gradeStyles: Record<SafetyRating['grade'], { bg: string; border: string; text: string; label: string }> = {
  A: { bg: 'rgba(42, 157, 143, 0.15)', border: 'rgba(42, 157, 143, 0.5)', text: '#2A9D8F', label: '安全' },
  B: { bg: 'rgba(233, 196, 106, 0.15)', border: 'rgba(233, 196, 106, 0.5)', text: '#E9C46A', label: '合格' },
  C: { bg: 'rgba(244, 162, 97, 0.15)', border: 'rgba(244, 162, 97, 0.5)', text: '#F4A261', label: '警告' },
  D: { bg: 'rgba(230, 57, 70, 0.15)', border: 'rgba(230, 57, 70, 0.5)', text: '#E63946', label: '危险' },
};

interface Props {
  rating: SafetyRating;
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingBadge({ rating, size = 'md' }: Props) {
  const style = gradeStyles[rating.grade];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-lg',
  }[size];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg font-bold ${sizeClasses}`}
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      <span className="font-display">{rating.grade}</span>
      <span className="opacity-80 font-medium">·</span>
      <span className="font-medium">{rating.score}分</span>
      <span className="opacity-70 font-normal">{style.label}</span>
    </span>
  );
}
