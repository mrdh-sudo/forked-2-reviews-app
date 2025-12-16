import type { ReviewService } from '../app/review-service.js';
import { listReviews } from '../app/list-reviews.js';
import type { ListReviewsResult } from '../app/list-reviews.js';
import { addReview } from '../app/add-review.js';
import type { AddReviewCommand, AddReviewResult } from '../app/add-review.js';
import { FakeReviewService } from '../infra/fake-review-service.js';
import { HttpReviewService } from '../infra/http-review-service.js';
import { seedReviews } from '../seed/reviews.js';

// Lazy singleton for the app's ReviewService implementation.
let _reviewService: ReviewService | undefined;

// Resolve which implementation to use based on env.
// - VITE_REVIEWS_SERVICE: 'fake' | 'http' (optional)
// - VITE_REVIEWS_BASE_URL: string (optional)
// - VITE_USE_SEED_DATA: 'true' | 'false' (optional, defaults to false)
function createReviewServiceFromEnv(): ReviewService {
  const env = import.meta.env as Record<string, string | undefined>;
  const kind = (env.VITE_REVIEWS_SERVICE || '').toLowerCase();
  const baseUrl = env.VITE_REVIEWS_BASE_URL;
  const useSeedData = env.VITE_USE_SEED_DATA === 'true';

  if (kind === 'fake') {
    return new FakeReviewService(useSeedData ? seedReviews : []);
  }
  if (kind === 'http') return new HttpReviewService({ baseUrl });

  // Auto-detect: if a base URL is provided, prefer HTTP; otherwise use fake.
  if (baseUrl) return new HttpReviewService({ baseUrl });
  return new FakeReviewService(useSeedData ? seedReviews : []);
}

export function getReviewService(): ReviewService {
  if (!_reviewService) {
    _reviewService = createReviewServiceFromEnv();
  }
  return _reviewService;
}

// Optional: allow overriding in tests or specialized bootstraps
export function setReviewService(service: ReviewService): void {
  _reviewService = service;
}

// Factories that return use case functions bound to the resolved service
export function makeListReviews(): () => Promise<ListReviewsResult> {
  const service = getReviewService();
  return () => listReviews(service);
}

export function makeAddReview(): (
  command: AddReviewCommand,
) => Promise<AddReviewResult> {
  const service = getReviewService();
  return (command: AddReviewCommand) => addReview(service, command);
}

// Public contract returned by buildReviewUses
export type Reviews = {
  listReviews: () => Promise<ListReviewsResult>;
  addReview: (command: AddReviewCommand) => Promise<AddReviewResult>;
};

// Compound factory returning both bound use case functions
export function buildReviewUses(): Reviews {
  return {
    listReviews: makeListReviews(),
    addReview: makeAddReview(),
  };
}

// Centralized DI key used by provider and composable
export const REVIEWS_KEY = 'Reviews' as const;
