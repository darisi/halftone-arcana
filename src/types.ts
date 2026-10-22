export interface TarotCardInfo {
  /** Display name, e.g. "The Fool". */
  name: string;
  /** URL segment, e.g. "the-fool". */
  slug: string;
  /** Short upright meaning. */
  meaning: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  backImage: string;
  thumbnail: string;
  count: number;
  getCardImage: (index: number) => string;
  getCardThumb: (index: number) => string;
  /** One entry per card, in draw order. Length must equal `count`. */
  cards: TarotCardInfo[];
}
