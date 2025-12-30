const GetProfileUseCase = require("../../../application/profile/usecases/GetProfileUseCase");
const UpsertProfileUseCase = require("../../../application/profile/usecases/UpsertProfileUseCase");
const ProfileRepositoryImpl = require("../../../infrastructure/repositories/ProfileRepositoryImpl");

// Get profile
const getProfile = async (req, res, next) => {
  try {
    const profileRepository = new ProfileRepositoryImpl();
    const getProfileUseCase = new GetProfileUseCase(profileRepository);

    const profile = await getProfileUseCase.execute(req.user.id);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

// Create or update profile
const upsertProfile = async (req, res, next) => {
  try {
    const profileRepository = new ProfileRepositoryImpl();
    const upsertProfileUseCase = new UpsertProfileUseCase(profileRepository);

    const profile = await upsertProfileUseCase.execute(req.user.id, req.body);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  upsertProfile,
};
