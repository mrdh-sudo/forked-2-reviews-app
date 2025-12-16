import type { ReviewService, AddReviewInput, Review } from './review-service.js';

export type AddReviewResult =
  | { success: true; review: Review }
  | { success: false; errors: readonly string[] };

// Command used by the application layer (decoupled from service DTOs)
export type AddReviewCommand = {
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
};

export type AddReviewUseCase = (
  service: ReviewService,
  command: AddReviewCommand,
) => Promise<AddReviewResult>;

export const addReview: AddReviewUseCase = async (service, command) => {
  try {
    // Map command -> service input explicitly, keeping layers decoupled
    const input: AddReviewInput = {
      rating: command.rating,
      title: command.title,
      comment: command.comment,
    };
    const { review } = await service.addReview(input);
    return { success: true, review };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, errors: [message] };
  }
};
