const SendUserMessage = require("../../../application/use-cases/chat/SendUserMessage");
const CreateChatSession = require("../../../application/use-cases/chat/CreateChatSession");
const DeleteChatSession = require("../../../application/use-cases/chat/DeleteChatSession");
const GetUserChatSessions = require("../../../application/use-cases/chat/GetUserChatSessions");
const GetChatMessages = require("../../../application/use-cases/chat/GetChatMessages");
const GetCoverLetter = require("../../../application/use-cases/chat/GetCoverLetter");
const DeleteCoverLetter = require("../../../application/use-cases/chat/DeleteCoverLetter");
const GetUserCoverLetters = require("../../../application/use-cases/chat/GetUserCoverLetter");

const ChatSessionRepositoryImpl = require("../../../infrastructure/repositories/ChatSessionRepositoryImpl");
const ChatMessageRepositoryImpl = require("../../../infrastructure/repositories/ChatMessageRepositoryImpl");

const CreateCoverLetter = require("../../../application/use-cases/chat/CreateCoverLetter");
const CoverLetterRepositoryImpl = require("../../../infrastructure/repositories/CoverLetterRepositoryImpl");

const inngest = require("../../../infrastructure/inngest/client");

// repositories
const chatSessionRepository = new ChatSessionRepositoryImpl();
const chatMessageRepository = new ChatMessageRepositoryImpl();

// use cases
const sendUserMessage = new SendUserMessage({
  chatSessionRepository,
  chatMessageRepository,
  inngest,
});

const createChatSession = new CreateChatSession({
  chatSessionRepository,
});

const getUserChatSessions = new GetUserChatSessions({
  chatSessionRepository,
});

const getChatMessages = new GetChatMessages({
  chatSessionRepository,
  chatMessageRepository,
});

const deleteChatSessionUseCase = new DeleteChatSession({
  chatSessionRepository,
  chatMessageRepository,
});

const coverLetterRepository = new CoverLetterRepositoryImpl();

const createCoverLetter = new CreateCoverLetter({
  coverLetterRepository,
  inngest,
});

const getCoverLetter = new GetCoverLetter({
  coverLetterRepository,
});

const deleteCoverLetter = new DeleteCoverLetter({
  coverLetterRepository,
});

// Create Chat Session
const createSession = async (req, res) => {
  const userId = req.user.id;
  const { type, title } = req.body;

  const session = await createChatSession.execute({
    userId,
    type,
    title,
  });

  res.status(201).json({
    success: true,
    data: session,
  });
};

// Send Message
const sendMessage = async (req, res) => {
  const { chatSessionId, content } = req.body;
  const userId = req.user.id;

  const result = await sendUserMessage.execute({
    userId,
    chatSessionId,
    content,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

const getSessions = async (req, res) => {
  const userId = req.user.id;

  const sessions = await getUserChatSessions.execute({ userId });

  res.status(200).json({
    success: true,
    data: sessions,
  });
};

const getMessages = async (req, res) => {
  const { chatSessionId } = req.params;
  const userId = req.user.id;

  const messages = await getChatMessages.execute({
    userId,
    chatSessionId,
  });

  res.status(200).json({
    success: true,
    data: messages,
  });
};

// Delete Chat Session
const deleteChatSession = async (req, res) => {
  const userId = req.user.id;
  const { chatSessionId } = req.params;

  await deleteChatSessionUseCase.execute({
    userId,
    chatSessionId,
  });

  res.status(200).json({
    success: true,
    message: "Chat session deleted",
  });
};

const generateCoverLetter = async (req, res) => {
  const userId = req.user.id;
  const { jobTitle, companyName, jobDescription } = req.body;

  const result = await createCoverLetter.execute({
    userId,
    jobTitle,
    companyName,
    jobDescription,
  });

  res.status(202).json({
    success: true,
    data: result,
  });
};

const getCoverLetterById = async (req, res) => {
  const userId = req.user.id;
  const { coverLetterId } = req.params;

  const coverLetter = await getCoverLetter.execute({
    userId,
    coverLetterId,
  });

  res.status(200).json({
    success: true,
    data: coverLetter,
  });
};

const deleteCoverLetterById = async (req, res) => {
  const userId = req.user.id;
  const { coverLetterId } = req.params;

  await deleteCoverLetter.execute({
    userId,
    coverLetterId,
  });

  res.status(200).json({
    success: true,
    message: "Cover letter deleted",
  });
};

const getAllCoverLetters = async (req, res) => {
  const userId = req.user.id; // from auth middleware

  const useCase = new GetUserCoverLetters({
    coverLetterRepository: new CoverLetterRepositoryImpl(),
  });

  const coverLetters = await useCase.execute(userId);

  return res.status(200).json({
    success: true,
    data: coverLetters,
  });
};

module.exports = {
  createSession,
  sendMessage,
  getSessions,
  getMessages,
  deleteChatSession,
  generateCoverLetter,
  getCoverLetterById,
  deleteCoverLetterById,
  getAllCoverLetters,
};
