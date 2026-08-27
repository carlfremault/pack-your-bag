import { YesOrNo } from '@repo/constants';
import { makeTextIcon } from '@repo/react-common/utilities';

export * from './constants.core';

export const laundryAccessOptions = [
  { value: YesOrNo.YES, label: 'Yes', icon: makeTextIcon('Yes') },
  { value: YesOrNo.NO, label: 'No', icon: makeTextIcon('No') },
];
