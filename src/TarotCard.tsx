'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Deck } from './types';
import { pickCardIndex } from './random';

export type CardState = 'idle' | 'flipping' | 'revealed' | 'returning' | 'shuffling';

const FLIP_DURATION_MS = 600;
const SHUFFLE_DURATION_MS = 600;
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 16"><rect width="9" height="16" fill="%23222"/><text x="4.5" y="8" fill="%23888" font-size="1" text-anchor="middle" font-family="sans-serif">Card unavailable</text></svg>'
  );

export interface TarotCardProps {
  deck: Deck;
  /** Increment to trigger a shuffle animation + return to face-down. */
  resetTrigger?: number;
  /** Reveal this card instead of picking at random (used by multi-card spreads). */
  index?: number;
  /** Optional verdict per card index, shown above the name (used by the yes/no draw). */
  answers?: string[];
}

export function TarotCard({ deck, resetTrigger = 0, index, answers }: TarotCardProps) {
  const [state, setState] = useState<CardState>('idle');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [backSrc, setBackSrc] = useState(deck.backImage);
  const [frontSrc, setFrontSrc] = useState(FALLBACK_IMAGE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // When the deck changes, reset the card to the new back
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setState('idle');
    setBackSrc(deck.backImage);
    setFrontSrc(FALLBACK_IMAGE);
    setCurrentIndex(0);
  }, [deck.id, deck.backImage]);

  // When resetTrigger changes, run the shuffle animation and return to idle
  useEffect(() => {
    if (resetTrigger === 0) return; // skip initial mount
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('shuffling');
    timerRef.current = setTimeout(() => {
      setState('idle');
      timerRef.current = null;
    }, SHUFFLE_DURATION_MS);
  }, [resetTrigger]);

  const handleClick = useCallback(() => {
    if (state === 'idle') {
      if (timerRef.current) clearTimeout(timerRef.current);
      const idx = index ?? pickCardIndex(deck.count);
      setCurrentIndex(idx);
      setFrontSrc(deck.getCardImage(idx));
      setState('flipping');
      timerRef.current = setTimeout(() => {
        setState('revealed');
        timerRef.current = null;
      }, FLIP_DURATION_MS);
    } else if (state === 'revealed') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('returning');
      timerRef.current = setTimeout(() => {
        setState('idle');
        timerRef.current = null;
      }, FLIP_DURATION_MS);
    }
    // 'flipping' / 'returning' / 'shuffling': no-op
  }, [state, deck, index]);

  const isShuffling = state === 'shuffling';
  const isRevealed = state === 'revealed';
  const drawn = deck.cards[currentIndex];

  return (
    <div className="w-full max-w-[19rem] sm:max-w-md flex flex-col items-center gap-4">
    <button
      type="button"
      onClick={handleClick}
      data-shuffling={isShuffling ? 'true' : undefined}
      className="card-container block w-full"
      aria-label="Tarot card, click to draw or flip back"
    >
      {/* Stack of fake cards behind the main one, visible only during shuffle */}
      <div className="shuffle-stack shuffle-stack-1" aria-hidden="true" />
      <div className="shuffle-stack shuffle-stack-2" aria-hidden="true" />
      <div className="shuffle-stack shuffle-stack-3" aria-hidden="true" />
      <div className="shuffle-stack shuffle-stack-4" aria-hidden="true" />

      {/* Main card (3D-flipping) */}
      <div className="card-inner" data-state={state}>
        <div className="card-face card-back">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backSrc}
            alt={`${deck.name} tarot card back`}
            width={900}
            height={1613}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
            onError={() => setBackSrc(FALLBACK_IMAGE)}
          />
        </div>
        <div className="card-face card-front">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frontSrc}
            alt={drawn ? `${drawn.name} tarot card` : ''}
            width={900}
            height={1613}
            decoding="async"
            className="w-full h-full object-cover"
            onError={() => setFrontSrc(FALLBACK_IMAGE)}
          />
        </div>
      </div>
    </button>

      <p aria-live="polite" className="min-h-[5.5rem] text-center">
        {isRevealed && drawn ? (
          <>
            {answers?.[currentIndex] ? (
              <strong className="block text-2xl font-semibold tracking-tight text-amber-300">
                {answers[currentIndex]}
              </strong>
            ) : null}
            <strong className="block text-lg font-semibold tracking-tight">
              {drawn.name}
            </strong>
            <span className="block text-sm text-white/60 mt-0.5">{drawn.meaning}</span>
            <a
              href={`/cards/${drawn.slug}`}
              className="inline-block mt-2 text-sm text-amber-300 underline underline-offset-4 hover:text-amber-200"
            >
              Read the full {drawn.name} meaning
            </a>
          </>
        ) : (
          <span className="text-sm text-white/55">Tap the card to draw</span>
        )}
      </p>
    </div>
  );
}
