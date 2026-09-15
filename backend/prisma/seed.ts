import { PrismaClient, Difficulty, AnswerOption } from "@prisma/client";

const prisma = new PrismaClient();

type SeedQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  difficulty: Difficulty;
  category: string;
};

const questions: SeedQuestion[] = [
  // ---- MEDIUM (25) ----
  { questionText: "Which algorithm is commonly used for binary classification problems?", optionA: "Linear Regression", optionB: "Logistic Regression", optionC: "K-Means", optionD: "PCA", correctAnswer: "B", difficulty: "MEDIUM", category: "ML" },
  { questionText: "What does 'overfitting' mean in machine learning?", optionA: "Model performs well on both train and test data", optionB: "Model fails to converge", optionC: "Model performs well on training data but poorly on unseen data", optionD: "Model has too few parameters", correctAnswer: "C", difficulty: "MEDIUM", category: "ML" },
  { questionText: "Which activation function outputs values between 0 and 1?", optionA: "ReLU", optionB: "Sigmoid", optionC: "Tanh", optionD: "Softplus", correctAnswer: "B", difficulty: "MEDIUM", category: "DL" },
  { questionText: "In a confusion matrix, what does a 'false positive' represent?", optionA: "Predicted negative, actually negative", optionB: "Predicted positive, actually positive", optionC: "Predicted positive, actually negative", optionD: "Predicted negative, actually positive", correctAnswer: "C", difficulty: "MEDIUM", category: "Evaluation Metrics" },
  { questionText: "Which Python library is primarily used for building and training neural networks?", optionA: "NumPy", optionB: "Pandas", optionC: "PyTorch", optionD: "Matplotlib", correctAnswer: "C", difficulty: "MEDIUM", category: "Python" },
  { questionText: "What is the main purpose of dropout in neural networks?", optionA: "Speed up training", optionB: "Reduce overfitting by randomly disabling neurons", optionC: "Increase model capacity", optionD: "Normalize input data", correctAnswer: "B", difficulty: "MEDIUM", category: "DL" },
  { questionText: "Which metric is most appropriate for evaluating a highly imbalanced classification dataset?", optionA: "Accuracy", optionB: "F1 Score", optionC: "Mean Squared Error", optionD: "R-squared", correctAnswer: "B", difficulty: "MEDIUM", category: "Evaluation Metrics" },
  { questionText: "What does 'NLP' stand for?", optionA: "Neural Language Processing", optionB: "Natural Language Processing", optionC: "Network Layer Protocol", optionD: "Natural Learning Program", correctAnswer: "B", difficulty: "MEDIUM", category: "NLP" },
  { questionText: "Which technique reduces the dimensionality of data while preserving variance?", optionA: "K-Means", optionB: "PCA", optionC: "Logistic Regression", optionD: "Gradient Boosting", correctAnswer: "B", difficulty: "MEDIUM", category: "ML" },
  { questionText: "In computer vision, what is the primary building block of a CNN used to detect local patterns?", optionA: "Pooling layer", optionB: "Convolutional layer", optionC: "Dense layer", optionD: "Dropout layer", correctAnswer: "B", difficulty: "MEDIUM", category: "Computer Vision" },
  { questionText: "What is the purpose of a validation set in model training?", optionA: "To train the final model", optionB: "To tune hyperparameters and detect overfitting during training", optionC: "To deploy the model", optionD: "To store raw data", correctAnswer: "B", difficulty: "MEDIUM", category: "ML" },
  { questionText: "Which of these is an unsupervised learning algorithm?", optionA: "Linear Regression", optionB: "K-Means Clustering", optionC: "Logistic Regression", optionD: "Random Forest", correctAnswer: "B", difficulty: "MEDIUM", category: "ML Algorithms" },
  { questionText: "What does 'LLM' stand for?", optionA: "Long Learning Model", optionB: "Large Language Model", optionC: "Linear Learning Machine", optionD: "Layered Language Model", correctAnswer: "B", difficulty: "MEDIUM", category: "LLMs" },
  { questionText: "In RAG (Retrieval-Augmented Generation), what is retrieved before generation?", optionA: "Model weights", optionB: "Relevant documents or context from an external source", optionC: "Random tokens", optionD: "Gradient updates", correctAnswer: "B", difficulty: "MEDIUM", category: "RAG" },
  { questionText: "Which loss function is commonly used for multi-class classification?", optionA: "Mean Squared Error", optionB: "Categorical Cross-Entropy", optionC: "Hinge Loss", optionD: "Huber Loss", correctAnswer: "B", difficulty: "MEDIUM", category: "DL" },
  { questionText: "What is the role of the 'learning rate' in gradient descent?", optionA: "Number of training epochs", optionB: "Size of the training dataset", optionC: "Step size taken during each parameter update", optionD: "Number of hidden layers", correctAnswer: "C", difficulty: "MEDIUM", category: "ML" },
  { questionText: "Which of the following best describes 'tokenization' in NLP?", optionA: "Encrypting text data", optionB: "Splitting text into smaller units like words or subwords", optionC: "Translating text to another language", optionD: "Removing punctuation only", correctAnswer: "B", difficulty: "MEDIUM", category: "NLP" },
  { questionText: "What does 'generative AI' primarily refer to?", optionA: "AI that only classifies data", optionB: "AI that creates new content such as text, images, or audio", optionC: "AI that stores data", optionD: "AI used only for search engines", correctAnswer: "B", difficulty: "MEDIUM", category: "Generative AI" },
  { questionText: "Which Python library is most commonly used for data manipulation and analysis?", optionA: "Pandas", optionB: "Flask", optionC: "Django", optionD: "Requests", correctAnswer: "A", difficulty: "MEDIUM", category: "Python" },
  { questionText: "What is the main advantage of using batch normalization in deep networks?", optionA: "Reduces the number of parameters", optionB: "Stabilizes and speeds up training", optionC: "Eliminates the need for activation functions", optionD: "Removes the need for a validation set", correctAnswer: "B", difficulty: "MEDIUM", category: "DL" },
  { questionText: "In evaluation metrics, what does 'recall' measure?", optionA: "Proportion of predicted positives that are correct", optionB: "Proportion of actual positives correctly identified", optionC: "Overall accuracy of the model", optionD: "Speed of the model", correctAnswer: "B", difficulty: "MEDIUM", category: "Evaluation Metrics" },
  { questionText: "Which neural network architecture is best suited for sequential data like text or time series?", optionA: "CNN", optionB: "RNN", optionC: "Autoencoder", optionD: "GAN", correctAnswer: "B", difficulty: "MEDIUM", category: "Neural Networks" },
  { questionText: "What is 'feature engineering' in machine learning?", optionA: "Designing the hardware for ML models", optionB: "Creating or transforming input variables to improve model performance", optionC: "Deploying models to production", optionD: "Writing unit tests for ML code", correctAnswer: "B", difficulty: "MEDIUM", category: "ML" },
  { questionText: "Which of these is a common ensemble learning technique?", optionA: "Random Forest", optionB: "K-Nearest Neighbors", optionC: "Naive Bayes", optionD: "Linear Regression", correctAnswer: "A", difficulty: "MEDIUM", category: "ML Algorithms" },
  { questionText: "What is the purpose of 'embeddings' in NLP and recommendation systems?", optionA: "To compress images", optionB: "To represent discrete items as dense numerical vectors capturing semantic meaning", optionC: "To encrypt user data", optionD: "To visualize training loss", correctAnswer: "B", difficulty: "MEDIUM", category: "NLP" },

  // ---- HARD (5) ----
  { questionText: "In the Transformer architecture, what is the primary purpose of 'self-attention'?", optionA: "To reduce the vocabulary size", optionB: "To allow each token to weigh the relevance of every other token in the sequence", optionC: "To normalize gradients across layers", optionD: "To compress the input embeddings", correctAnswer: "B", difficulty: "HARD", category: "Transformers" },
  { questionText: "Why do Transformers require positional encodings?", optionA: "To reduce the number of attention heads", optionB: "Because self-attention has no inherent notion of token order", optionC: "To normalize the output logits", optionD: "To prevent overfitting", correctAnswer: "B", difficulty: "HARD", category: "Transformers" },
  { questionText: "In evaluating a fraud/anomaly detection model with severe class imbalance, why can AUC-ROC be misleading compared to AUC-PR (precision-recall)?", optionA: "AUC-ROC cannot be computed for binary classifiers", optionB: "AUC-ROC can look high even with poor precision on the rare positive class, since it accounts for the large number of true negatives", optionC: "AUC-PR ignores recall entirely", optionD: "AUC-ROC only works for multi-class problems", correctAnswer: "B", difficulty: "HARD", category: "Evaluation Metrics" },
  { questionText: "What is the 'vanishing gradient' problem, and which architecture change specifically helps mitigate it in deep networks?", optionA: "Gradients grow uncontrollably; fixed by gradient clipping only", optionB: "Gradients shrink toward zero in early layers during backpropagation; residual/skip connections help by providing a more direct gradient path", optionC: "It only affects convolutional layers and is fixed by pooling", optionD: "It is caused by too small a learning rate and fixed by increasing batch size", correctAnswer: "B", difficulty: "HARD", category: "Deep Learning" },
  { questionText: "In a RAG pipeline, what is a key reason retrieved context can still lead to a hallucinated answer from the LLM?", optionA: "The vector database always returns exact matches", optionB: "The LLM may ignore or misweight the retrieved context and rely on parametric memory instead, especially if the context is irrelevant or contradictory", optionC: "RAG systems do not use embeddings", optionD: "Hallucination is impossible once retrieval is added", correctAnswer: "B", difficulty: "HARD", category: "RAG" },
];

async function main() {
  const total = questions.length;
  const mediumCount = questions.filter((q) => q.difficulty === "MEDIUM").length;
  const hardCount = questions.filter((q) => q.difficulty === "HARD").length;

  if (total !== 30 || mediumCount !== 25 || hardCount !== 5) {
    throw new Error(
      `Seed validation failed: total=${total} (want 30), medium=${mediumCount} (want 25), hard=${hardCount} (want 5)`
    );
  }
  for (const q of questions) {
    const opts = [q.optionA, q.optionB, q.optionC, q.optionD];
    if (opts.some((o) => !o || !o.trim())) {
      throw new Error(`Seed validation failed: question missing an option -> "${q.questionText}"`);
    }
    if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
      throw new Error(`Seed validation failed: invalid correct answer -> "${q.questionText}"`);
    }
  }

  const quiz = await prisma.quiz.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "ByteBattle 2026",
      status: "DRAFT",
      durationMinutes: 30,
      requiredTotal: 30,
      requiredMedium: 25,
      requiredHard: 5,
    },
  });

await prisma.answer.deleteMany({
  where: {
    question: {
      quizId: quiz.id,
    },
  },
});

await prisma.question.deleteMany({
  where: {
    quizId: quiz.id,
  },
});
  await prisma.question.createMany({
    data: questions.map((q, i) => ({ ...q, quizId: quiz.id, displayOrder: i + 1 })),
  });

  console.log(`Seeded quiz "${quiz.name}" with ${total} questions (${mediumCount} medium, ${hardCount} hard).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
