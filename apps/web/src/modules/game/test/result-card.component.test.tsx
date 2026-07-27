import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ResultCard } from '../components/result-card.component';
import type { ResultLabels, ResultView } from '../model/game.types';

const labels: ResultLabels = {
  title: 'النتائج',
  compactSummaryTitle: 'الإشارات',
  detailedTraitsTitle: 'الملامح',
  imageQualityTitle: 'الجودة',
  uncertaintyTitle: 'عدم اليقين',
  scoreLabel: 'توافق الأسلوب',
  reasonLabel: 'السبب',
  matchingTraitsLabel: 'ملامح متطابقة',
  weakTraitsLabel: 'أقل يقينًا',
  mismatchLabel: 'تنبيهات',
  listSeparator: '، ',
  rankLabel: 'التطابق رقم',
  fallbackTitle: 'لا توجد نتائج',
  retryButton: 'إعادة',
  shareButton: 'مشاركة',
  donateLabel: 'دعم',
  scoreExplanation: 'تفسير',
  uncertaintyExplanation: 'عدم يقين',
  mismatchExplanation: 'تنبيه',
  detailsButton: 'التفاصيل',
  detailsTitle: 'معلومات عامة موثقة',
  detailsClose: 'إغلاق',
  biographyLabel: 'نبذة',
  occupationsLabel: 'المجالات',
  wikipediaLink: 'ويكيبيديا',
  googleSearchLink: 'بحث Google',
  imageAttributionLabel: 'نَسب الصورة',
};

const result: ResultView = {
  name: 'Dan Avidan',
  rank: 10,
  scorePercent: 82,
  verdictLabel: 'قوي',
  confidenceLabel: 'ثقة مرتفعة',
  countryOrRegion: 'الولايات المتحدة',
  categoryLabel: 'ممثل',
  reason: 'ابتسامة دافئة وانطباع متوازن.',
  topMatchingTraits: ['ابتسامة دافئة'],
  secondaryMatchingTraits: [],
  weakOrUncertainTraits: [],
  mismatchWarnings: [],
};

describe('ResultCard mixed-direction rendering', () => {
  it('isolates the Arabic label, LTR rank, and auto-direction public name', () => {
    const { container } = render(
      <ResultCard result={result} labels={labels} showDetails={false} onOpenDetails={vi.fn()} />,
    );

    expect(screen.getByText('التطابق رقم')).toBeInTheDocument();
    expect(screen.getByText('#10')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('Dan Avidan')).toHaveAttribute('dir', 'auto');
    expect(container.textContent).not.toContain('التطابق رقم #10Dan Avidan');
  });

  it('isolates the numeric percentage from the RTL label', () => {
    render(
      <ResultCard result={result} labels={labels} showDetails={false} onOpenDetails={vi.fn()} />,
    );

    expect(screen.getByText('82%')).toHaveAttribute('dir', 'ltr');
  });
});
