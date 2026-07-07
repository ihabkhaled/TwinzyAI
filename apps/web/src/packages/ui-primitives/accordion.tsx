'use client';
// client-boundary-reason: owns the expanded/collapsed disclosure state of an accessible accordion item.

import { type ReactElement, type ReactNode, useCallback, useId, useState } from 'react';

import { ChevronDownIcon } from '@/packages/icons';

import {
  accordionChevronVariants,
  accordionContentVariants,
  accordionItemVariants,
  accordionTriggerVariants,
} from './accordion.variants';
import type { Testable } from './testable';

export interface AccordionItemProps extends Testable {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * One accessible disclosure section: a real <button> trigger carrying
 * aria-expanded + aria-controls, and a labelled region revealed on demand.
 * Content is NOT mounted while closed, so heavy lists render lazily.
 * Keyboard support comes from the native button; the chevron only animates
 * under motion-safe.
 */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  testId,
}: Readonly<AccordionItemProps>): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const triggerId = useId();

  const onToggle = useCallback((): void => {
    setIsOpen((open) => !open);
  }, []);

  return (
    <div className={accordionItemVariants()} data-testid={testId}>
      <h3>
        <button
          type="button"
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
          className={accordionTriggerVariants()}
        >
          {title}
          <ChevronDownIcon
            aria-hidden
            size={18}
            className={accordionChevronVariants({ open: isOpen })}
          />
        </button>
      </h3>
      {isOpen ? (
        <div
          role="region"
          id={contentId}
          aria-labelledby={triggerId}
          className={accordionContentVariants()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
