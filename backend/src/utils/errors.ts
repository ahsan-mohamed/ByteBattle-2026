export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const Errors = {
  quizNotActive: () => new AppError("This quiz is currently unavailable.", 409),
  quizNotStarted: () => new AppError("Quiz has not started yet.", 409),
  quizEnded: () => new AppError("Quiz has ended.", 409),
  alreadySubmitted: () => new AppError("Your attempt has already been submitted.", 409),
  sessionExpired: () => new AppError("Your quiz session has expired.", 410),
  violationLimitExceeded: () =>
    new AppError("You have exceeded the allowed violation limit.", 403),
  notFound: (what: string) => new AppError(`${what} not found.`, 404),
  invalidAttempt: () => new AppError("Invalid or unknown attempt.", 401),
};
