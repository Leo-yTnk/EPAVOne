import { viewRepository } from '../repositories/viewRepository.js';
export const plannerViewService = {
  read: (key, defaults) => viewRepository.read(key, defaults),
  save: (key, values) => viewRepository.save(key, values)
};
