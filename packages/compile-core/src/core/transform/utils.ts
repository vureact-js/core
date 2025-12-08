import { capitalize } from '@utils/capitalize';

export const createVModelEvName = (modelName: string) => `onUpdate${capitalize(modelName)}`;
